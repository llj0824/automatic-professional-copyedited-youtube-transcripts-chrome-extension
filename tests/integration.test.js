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

import { initializePopup } from '../popup/popup.js';
import StorageUtils from '../popup/storage_utils.js';
import YoutubeTranscriptRetriever from '../popup/youtube_transcript_retrival.js';
const puppeteer = require('puppeteer');
const path = require('path');

describe('YouTube Transcript Extension Integration Tests', () => {
  // Test constants
  const SHORT_VIDEO_ID = 'jNQXAC9IVRw'; // "Me at the zoo" - First YouTube video (0:18)
  const LONG_VIDEO_ID = 'SzCpCbQ27Kk';   // IA Summit 2024 Fireside Chat
  let browser;
  let page;
  let extensionPopup;
  const extensionPath = path.join(__dirname, '../dist');
  
  beforeAll(async () => {
    // Increase timeout for browser launch
    jest.setTimeout(30000); // 30 seconds timeout

    try {
      browser = await puppeteer.launch({
        headless: false, // Need headed mode for extension testing
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        ignoreDefaultArgs: ['--enable-automation']
      });

      // Wait and verify extension loading
      let extensionTarget = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!extensionTarget && attempts < maxAttempts) {
        console.log(`Attempt ${attempts + 1} to find extension...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const targets = await browser.targets();
        console.log('Current targets:', targets.map(t => ({
          type: t.type(),
          url: t.url()
        })));
        
        extensionTarget = targets.find(target => 
          target.url().startsWith('chrome-extension://')
        );
        
        attempts++;
      }

      if (!extensionTarget) {
        console.error('Failed to load extension after', maxAttempts, 'attempts');
        console.error('Extension path:', extensionPath);
        console.error('Available targets:', await browser.targets());
        throw new Error('Extension failed to load');
      }

      console.log('Extension loaded successfully:', extensionTarget.url());
      
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
  }, 30000); // Explicit timeout for beforeAll

  beforeEach(async () => {
    try {
      page = await browser.newPage();
      
      // Get the extension ID - Updated method to find any extension target
      const targets = await browser.targets();
      const extensionTarget = targets.find(target => 
        target.url().startsWith('chrome-extension://')
      );
      
      if (!extensionTarget) {
        console.error('Available targets:', targets.map(t => ({
          type: t.type(),
          url: t.url()
        })));
        throw new Error('Extension target not found');
      }
      
      const extensionUrl = extensionTarget.url();
      const extensionId = extensionUrl.split('/')[2];
      
      console.log('Found extension ID:', extensionId);
      
      // Open extension popup
      extensionPopup = await browser.newPage();
      await extensionPopup.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Clear storage
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Failed in beforeEach:', error);
      throw error;
    }
  }, 10000); // Explicit timeout for beforeEach

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
    // Navigate to YouTube video
    await page.goto(`https://www.youtube.com/watch?v=${SHORT_VIDEO_ID}`);
    await page.waitForTimeout(2000); // Wait for video to load
    
    // Initialize required utilities
    const storageUtils = new StorageUtils();
    const youtubeTranscriptRetriever = new YoutubeTranscriptRetriever();
    
    // Initialize the popup
    await initializePopup(document, storageUtils, youtubeTranscriptRetriever);
    
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
  }, 30000);

  test('should retrieve, save, and load transcript for short video', async () => {
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
    await page.waitForTimeout(2000);

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
