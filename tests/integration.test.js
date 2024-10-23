import { initializePopup } from '../popup/popup.js';
import StorageUtils from '../popup/storage_utils.js';
import YoutubeTranscriptRetriever from '../popup/youtube_transcript_retrival.js';

describe('YouTube Transcript Extension Integration Tests', () => {
  // Test constants
  const SHORT_VIDEO_ID = 'jNQXAC9IVRw'; // "Me at the zoo" - First YouTube video (0:18)
  const LONG_VIDEO_ID = 'SzCpCbQ27Kk';   // IA Summit 2024 Fireside Chat With Mustafa Suleyman: From SaaS to Agents
  
  // Helper to create a minimal document structure needed for the extension
  function setupTestDocument() {
    document.body.innerHTML = `
      <div id="status-indicator"></div>
      <div id="transcript-input-section"></div>
      <div id="api-section"></div>
      <div id="transcript-section"></div>
      <div id="content-section"></div>
      <div id="actions"></div>
      
      <div id="transcript-display"></div>
      <div id="processed-display"></div>
      <div id="segment-info"></div>
      
      <button id="prev-btn">Previous</button>
      <button id="next-btn">Next</button>
      <button id="process-btn">Process</button>
      <button id="save-keys-btn">Save Keys</button>
      <button id="load-transcript-btn">Load Transcript</button>
      
      <div id="loader" class="hidden"></div>
      
      <input id="openai-api-key" type="text">
      <input id="anthropic-api-key" type="text">
      <select id="model-select">
        <option value="gpt-4">GPT-4</option>
        <option value="claude-3">Claude 3</option>
      </select>
      <textarea id="transcript-input"></textarea>
      
      <div class="tab-buttons">
        <button class="tab-button" data-tab="raw">Raw</button>
        <button class="tab-button" data-tab="processed">Processed</button>
      </div>
      <div class="tab-content" id="raw"></div>
      <div class="tab-content" id="procbessed"></div>
    `;
  }

  beforeEach(() => {
    setupTestDocument();
  });

  test.only('should initialize with valid YouTube video page', async () => {
    // Create instances of required utilities
    const storageUtils = new StorageUtils();
    const youtubeTranscriptRetriever = new YoutubeTranscriptRetriever();

    // Mock the current tab to point to a YouTube video
    chrome.tabs.create({ 
      url: `https://www.youtube.com/watch?v=${SHORT_VIDEO_ID}` 
    });

    // Initialize the popup
    await initializePopup(document, storageUtils, youtubeTranscriptRetriever);

    // Verify initialization
    expect(document.getElementById('status-indicator').textContent).toContain('✅');
    expect(document.getElementById('transcript-section').classList.contains('hidden')).toBeFalsy();
    expect(document.getElementById('transcript-display').textContent).not.toBe('');
  }, 30000); // Longer timeout for real API calls

  test('should retrieve, save, and then be able to load raw and processed transcript - short video', async () => {
    // Clear storage before test
    await chrome.storage.local.clear();
    
    const storageUtils = new StorageUtils();
    const youtubeTranscriptRetriever = new YoutubeTranscriptRetriever();

    // Set up video page
    chrome.tabs.create({ 
      url: `https://www.youtube.com/watch?v=${SHORT_VIDEO_ID}` 
    });

    // Initialize and verify initial load
    await initializePopup(document, storageUtils, youtubeTranscriptRetriever);
    
    // Verify raw transcript was retrieved and saved
    const rawTranscript = document.getElementById('transcript-display').textContent;
    expect(rawTranscript).toContain('[0:'); // Should have timestamps
    
    // Process the transcript
    const processBtn = document.getElementById('process-btn');
    processBtn.click();
    
    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify processed transcript
    const processedTranscript = document.getElementById('processed-display').textContent;
    expect(processedTranscript).toContain('->'); // Should have time ranges
    expect(processedTranscript).toContain(':'); // Should have speaker labels
    
    // Verify single page navigation
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    expect(prevBtn.disabled).toBeTruthy();
    expect(nextBtn.disabled).toBeTruthy();
  }, 60000);

  test('should load raw and processed transcript - long video', async () => {
    const storageUtils = new StorageUtils();
    const youtubeTranscriptRetriever = new YoutubeTranscriptRetriever();

    // Set up video page
    chrome.tabs.create({ 
      url: `https://www.youtube.com/watch?v=${LONG_VIDEO_ID}` 
    });

    // Initialize and load from storage
    await initializePopup(document, storageUtils, youtubeTranscriptRetriever);
    
    // Verify pagination
    const segmentInfo = document.getElementById('segment-info');
    expect(segmentInfo.textContent).toContain('1 of'); // Should show pagination
    
    // Test navigation
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    
    expect(prevBtn.disabled).toBeTruthy(); // Should start at first page
    expect(nextBtn.disabled).toBeFalsy(); // Should have more pages
    
    // Navigate through pages
    nextBtn.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(prevBtn.disabled).toBeFalsy(); // Should now be able to go back
    expect(document.getElementById('segment-info').textContent).toContain('2 of');
  });
});

