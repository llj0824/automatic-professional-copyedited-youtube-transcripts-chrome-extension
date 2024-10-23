/**
 * Integration Tests for YouTube Transcript Extension
 * 
 * Purpose:
 * These tests are designed to mimic real user interactions as closely as possible.
 * Rather than mocking APIs and responses, we make actual calls to YouTube and storage
 * to verify the full workflow functions correctly.
 * 
 * Testing Philosophy:
 * - Avoid mocks/stubs where possible
 * - Use real YouTube videos with known transcripts
 * - Make actual API calls
 * - Test complete user workflows
 * - Allow for realistic timing/delays
 *
 * Note: These tests require:
 * - Active internet connection
 * - Valid API keys in storage
 * - Access to test YouTube videos
 *
 * Test Environment:
 * - Tests run in an isolated Puppeteer browser instance
 * - Storage operations only affect the test environment
 * - Your actual Chrome browser and its storage remain unchanged
 */

// import { initializePopup } from '../popup/popup.js';
// import StorageUtils from '../popup/storage_utils.js';
// import YoutubeTranscriptRetriever from '../popup/youtube_transcript_retrival.js';
const puppeteer = require('puppeteer');
const path = require('path');

// Add new helper function at the top level
async function setupTestEnvironment(extensionPath) {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        ignoreDefaultArgs: [
            '--enable-automation',
            '--enable-external-memory-accounted-in-global-limit'
        ]
    });


    // Wait for extension to load in the default context
    // Extensions can only run in the default browser context, not in other contexts like incognito
    // See browser context hierarchy:
    // Chrome Process (OS Level)
    // └── DevTools Protocol (CDP)
    //     └── Browser Instance (Puppeteer browser object)
    //         └── Targets (Pages, Workers, Extensions)
    //             ├── Window 1 (Chrome window) 
    //             │   ├── Tab 1 (Page object)
    //             │   └── Tab 2 (Page object) 
    //             └── Window 2
    //                 ├── Tab 3
    //                 └── Tab 4
    // Create a new page first
    const page = await browser.newPage();

    // Navigate to chrome://extensions to force extension registration
    await page.goto('chrome://extensions/');


    // Wait for extension target
    // i.e. target = {
    //     type: 'service_worker',
    //     url: 'chrome-extension://cdfkcbohnhhhjobmijmcnnlidhklfomc/background/service_worker.js'
    // }
    console.log('Waiting for extension target...to load');
    const maxTries = 10
    // This will wait for a service worker target that matches our criteria
    // Try up to 10 times to find the extension target
    for (let i = 0; i < maxTries; i++) {
        const targets = await browser.targets();

        console.log(`[${Date.now()}] Currently Available targets:`,
            targets.map(t => ({
                type: t.type(),
                url: t.url()
            }))
        );

        // Find target that matches our criteria
        const target = targets.find(target =>
            target.type() === 'service_worker' &&
            target.url().includes('chrome-extension://')
        );

        if (target) {
            // Return true when we find what we're looking for
            const extensionId = target.url().split('/')[2];
            return { browser, extensionId, page };
        } else {
            // If browser target not found, most of item the extension html element is loaded. Try clicking the extension's reload button
            const reloadButton = await page.$('>>> cr-icon-button[title="Reload"]');
            if (reloadButton) {
                await reloadButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        await page.reload()
        // Try to find and click the reload button on the extension's page. 
        // I notice the helps it register it, thru manual testing...
        // This is just a frustating race condition, not sure why it's not detecting it.
        console.log(`[${Date.now()}] Extension target not found, attempt ${i + 1}/10`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!extensionTarget) {
        throw new Error('Extension failed to load');
    }

    // Extract extension ID from URL
    const extensionId = extensionTarget.url().split('/')[2];
    console.log('Found extension with ID:', extensionId);

    return { browser, extensionId, page };
}

describe('YouTube Transcript Extension Integration Tests', () => {
    // Test constants
    const SHORT_VIDEO_ID = 'jNQXAC9IVRw'; // "Me at the zoo" - First YouTube video (0:18)
    const LONG_VIDEO_ID = 'SzCpCbQ27Kk';   // IA Summit 2024 Fireside Chat
    let browser;
    let page;
    let extensionPopup;
    const extensionPath = path.join(__dirname, '../dist');

    beforeAll(async () => {
        // Close the default browser instance
        // await global.browser.close();
        jest.setTimeout(30000);

        try {
            // Replace the entire browser launch and extension detection logic
            const { browser: testBrowser, extensionId: extensionId, page: testPage } =
                await setupTestEnvironment(extensionPath);

            browser = testBrowser;
            page = testPage;

            // Open extension popup
            extensionPopup = await browser.newPage();
            await extensionPopup.goto(`chrome-extension://${extensionId}/popup/popup.html`);

            console.log('Extension loaded successfully with ID:', extensionId);
        } catch (error) {
            console.error('Failed to launch browser:', error);
            throw error;
        }
    }, 30000);

    // Replace all waitForTimeout calls with waitForTimeout helper function
    const waitForTimeout = async (page, ms) => {
        await new Promise(resolve => setTimeout(resolve, ms));
    };

    afterEach(async () => {
        try {
            if (page) await page.close();
            if (extensionPopup) await extensionPopup.close();
        } catch (error) {
            console.error('Failed in afterEach:', error);
        }
    });

    afterAll(async () => {
        try {
            if (browser) await browser.close();
        } catch (error) {
            console.error('Failed in afterAll:', error);
        }
    });

    test.only('should initialize with valid YouTube video page', async () => {
        try {
            // Navigate to YouTube video
            await page.goto(`https://www.youtube.com/watch?v=${SHORT_VIDEO_ID}`);
            await waitForTimeout(page, 5000);


            // The extension's popup.html already includes all necessary scripts
            // We just need to verify the initialization worked

            // Wait for status indicator to appear
            await extensionPopup.waitForSelector('#status-indicator');

            // Verify popup initialized correctly using Puppeteer
            const statusIndicator = await extensionPopup.$eval(
                '#status-indicator',
                el => el.textContent
            );
            expect(statusIndicator).toContain('✅');

            // Verify transcript section is visible
            const transcriptSection = await extensionPopup.$eval(
                '#transcript-section',
                el => !el.classList.contains('hidden')
            );
            expect(transcriptSection).toBeTruthy();

            // Verify transcript display has content
            const transcriptDisplay = await extensionPopup.$eval(
                '#transcript-display',
                el => el.textContent
            );
            expect(transcriptDisplay).not.toBe('');
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    }, 30000);

    test('should retrieve, save, and load transcript for short video', async () => {
        // TODO: need to clear the cache entry for just this videoID.

        // Navigate to test video
        await page.goto(`https://www.youtube.com/watch?v=${SHORT_VIDEO_ID}`);
        await page.waitForTimeout(2000);

        // Click load transcript button
        await extensionPopup.click('#load-transcript-btn');
        await extensionPopup.waitForTimeout(3000); // Wait for transcript retrieval

        // Verify raw transcript loaded
        const rawTranscript = await extensionPopup.$eval(
            '#transcript-display',
            el => el.textContent
        );
        expect(rawTranscript).toContain('[0:'); // Check for timestamps

        // Set API keys (required for processing)
        await extensionPopup.type('#openai-api-key', process.env.OPENAI_API_KEY);
        await extensionPopup.click('#save-keys-btn');

        // Process transcript
        await extensionPopup.click('#process-btn');
        await extensionPopup.waitForTimeout(5000); // Wait for processing

        // Verify processed transcript
        const processedTranscript = await extensionPopup.$eval(
            '#processed-display',
            el => el.textContent
        );
        expect(processedTranscript).toContain('->'); // Check for time ranges
        expect(processedTranscript).toContain('Speaker:'); // Check for speaker labels

        // Verify single page navigation
        const prevBtnDisabled = await extensionPopup.$eval('#prev-btn', btn => btn.disabled);
        const nextBtnDisabled = await extensionPopup.$eval('#next-btn', btn => btn.disabled);
        expect(prevBtnDisabled).toBeTruthy();
        expect(nextBtnDisabled).toBeTruthy();
    }, 60000);

    test('should handle pagination for long video', async () => {
        // Navigate to long video
        await page.goto(`https://www.youtube.com/watch?v=${LONG_VIDEO_ID}`);
        await waitForTimeout(page, 5000);

        // Load transcript
        await extensionPopup.click('#load-transcript-btn');
        await extensionPopup.waitForTimeout(3000);

        // Verify initial pagination state
        const initialSegmentInfo = await extensionPopup.$eval(
            '#segment-info',
            el => el.textContent
        );
        expect(initialSegmentInfo).toContain('1 of');

        // Verify navigation buttons
        const prevBtnDisabled = await extensionPopup.$eval(
            '#prev-btn',
            btn => btn.disabled
        );
        const nextBtnEnabled = await extensionPopup.$eval(
            '#next-btn',
            btn => !btn.disabled
        );
        expect(prevBtnDisabled).toBeTruthy();
        expect(nextBtnEnabled).toBeTruthy();

        // Test navigation
        await extensionPopup.click('#next-btn');
        await extensionPopup.waitForTimeout(1000);

        // Verify new page
        const newSegmentInfo = await extensionPopup.$eval(
            '#segment-info',
            el => el.textContent
        );
        expect(newSegmentInfo).toContain('2 of');

        // Verify prev button now enabled
        const prevBtnEnabled = await extensionPopup.$eval(
            '#prev-btn',
            btn => !btn.disabled
        );
        expect(prevBtnEnabled).toBeTruthy();
    }, 60000);
});
