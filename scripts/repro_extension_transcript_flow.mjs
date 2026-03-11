import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const repoPath = process.cwd();
const defaultVideoUrl = 'https://www.youtube.com/watch?v=W0ltbBby9FU';
const defaultTimeoutMs = 45000;

function parseArgs(argv) {
  const options = {
    headless: false,
    keepOpen: false,
    videoUrl: defaultVideoUrl,
    timeoutMs: defaultTimeoutMs,
  };

  for (const arg of argv) {
    if (arg === '--headless') {
      options.headless = true;
      continue;
    }

    if (arg === '--keep-open') {
      options.keepOpen = true;
      continue;
    }

    if (arg.startsWith('--video-url=')) {
      options.videoUrl = arg.slice('--video-url='.length);
      continue;
    }

    if (arg.startsWith('--timeout-ms=')) {
      const parsedTimeout = Number.parseInt(arg.slice('--timeout-ms='.length), 10);
      if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
        options.timeoutMs = parsedTimeout;
      }
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function attachConsoleLogging(page, label) {
  page.on('console', (message) => {
    console.log(`[${label} console:${message.type()}] ${message.text()}`);
  });

  page.on('pageerror', (error) => {
    console.log(`[${label} pageerror] ${error.message}`);
  });
}

async function waitForExtensionId(context) {
  const existingWorker = context.serviceWorkers()[0];
  const worker = existingWorker || await context.waitForEvent('serviceworker');
  return new URL(worker.url()).host;
}

async function getActiveYouTubeTab(serviceWorker) {
  const [tab] = await serviceWorker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs
      .filter((entry) => entry.url?.includes('youtube.com/watch'))
      .map((entry) => ({ id: entry.id, url: entry.url, windowId: entry.windowId }));
  });

  if (!tab?.id) {
    throw new Error('Unable to find the active YouTube watch tab.');
  }

  return tab;
}

async function readPopupState(page) {
  return page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
    const value = (selector) => document.querySelector(selector)?.value || '';
    const visible = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;

      const style = window.getComputedStyle(element);
      return !element.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden';
    };

    return {
      currentUrl: window.location.href,
      guideVisible: visible('#guide-state'),
      loadingVisible: visible('#loading-state'),
      readyVisible: visible('#ready-state'),
      rawTabVisible: visible('#raw'),
      processedTabVisible: visible('#processed'),
      highlightsTabVisible: visible('#highlights'),
      rawTranscriptLength: text('#transcript-display').length,
      rawTranscriptPreview: text('#transcript-display').slice(0, 240),
      processedTranscriptLength: text('#processed-display').length,
      highlightsLength: value('#highlight-results').length,
      loadingStatus: text('#loading-status'),
      pageInfo: text('#page-info'),
      checkAgainText: text('#check-again-btn'),
    };
  });
}

async function waitForReadyState(page, timeoutMs) {
  const startedAt = Date.now();
  let lastState = await readPopupState(page);

  while (Date.now() - startedAt < timeoutMs) {
    lastState = await readPopupState(page);
    if (lastState.readyVisible && lastState.rawTranscriptLength > 0) {
      return { success: true, state: lastState };
    }

    await page.waitForTimeout(1000);
  }

  return { success: false, state: lastState };
}

async function ensureScreenshotsDir() {
  const screenshotsDir = path.join(repoPath, 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });
  return screenshotsDir;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const userDataDir = path.join(os.tmpdir(), 'codex-youtube-transcript-extension-profile');
  const screenshotsDir = await ensureScreenshotsDir();

  await fs.rm(userDataDir, { recursive: true, force: true });

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: options.headless,
    viewport: { width: 1440, height: 960 },
    args: [
      `--disable-extensions-except=${repoPath}`,
      `--load-extension=${repoPath}`,
    ],
  });

  try {
    const extensionId = await waitForExtensionId(context);
    const serviceWorker = context.serviceWorkers()[0];

    await serviceWorker.evaluate(async () => {
      await chrome.storage.local.clear();
    });

    const youtubePage = context.pages()[0] || await context.newPage();
    attachConsoleLogging(youtubePage, 'youtube');
    await youtubePage.goto(options.videoUrl, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs });
    await youtubePage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const targetTab = await getActiveYouTubeTab(serviceWorker);
    const popupPage = await context.newPage();
    attachConsoleLogging(popupPage, 'popup');

    const popupUrl = `chrome-extension://${extensionId}/popup/popup.html?tabId=${targetTab.id}`;
    await popupPage.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs });

    const result = await waitForReadyState(popupPage, options.timeoutMs);
    const finalState = result.state;

    const youtubeScreenshotPath = path.join(screenshotsDir, 'playwright-youtube-watch-page.png');
    const popupScreenshotPath = path.join(
      screenshotsDir,
      result.success ? 'playwright-extension-ready-state.png' : 'playwright-extension-stuck-state.png'
    );

    await youtubePage.screenshot({ path: youtubeScreenshotPath, fullPage: true });
    await popupPage.screenshot({ path: popupScreenshotPath, fullPage: true });

    console.log(JSON.stringify({
      success: result.success,
      extensionId,
      targetTab,
      popupUrl,
      finalState,
      youtubeScreenshotPath,
      popupScreenshotPath,
      note: 'The harness loads popup.html with an explicit tabId because Chrome sidePanel.open requires a real user gesture.',
    }, null, 2));

    if (!result.success) {
      process.exitCode = 1;
    }

    if (options.keepOpen) {
      console.log('Keeping the browser open for interactive debugging. Press Ctrl+C when you are done.');
      await new Promise(() => {});
    }
  } finally {
    if (!options.keepOpen) {
      await context.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
