/**
 * @file tests/popup.test.js
 * @description Updated integration tests for popup.js utilizing domMockSetup from setupJestMocks.js
 */

import StorageUtils from '../popup/storage_utils.js';
import { domMockSetup } from './domMockSetup';
domMockSetup();
import { initializePopup, parseTranscript, paginateTranscript,handlePrevClick,handleNextClick } from '../popup/popup.js';

// Import the setup for Jest mocks, including DOM setup
import './setupJestMocks.js';

const videoId= 'c-05IPtt54k';
const rawTranscriptBegining='[0:00] today is uh October 17th okay about one\n[0:04] week ago exactly six days ago uh';

// Mock LLM_API_Utils`
jest.mock('../popup/llm_api_utils.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      loadApiKeys: jest.fn().mockResolvedValue(),
      call_llm: jest.fn().mockResolvedValue('Mocked LLM response'),
      // Add other methods if needed
    };
  });
});

describe('Popup Integration Tests with DI', () => {
  let mockStorageUtils;
  let mockYoutubeTranscriptRetriever;

  beforeEach(() => {
    // Reset modules and mocks before each test
    jest.resetModules();
    jest.clearAllMocks();

    // Create a mock instance of StorageUtils
    mockStorageUtils = {
      getCurrentYouTubeVideoId: jest.fn().mockResolvedValue(videoId),
      loadTranscriptsById: jest.fn().mockResolvedValue({ rawTranscript: rawTranscriptBegining }),
      saveRawTranscriptById: jest.fn().mockResolvedValue(),
      saveProcessedTranscriptById: jest.fn().mockResolvedValue(),
    };

    mockYoutubeTranscriptRetriever = {
      fetchParsedTranscript: jest.fn().mockResolvedValue(videoId),
    }

    // Reset any global variables if used
    global.segments = [];
    global.processedSegments = [];
    global.currentSegmentIndex = 0;

    // Initialize the popup with the mocked DOM and injected storageUtils
    initializePopup(document, mockStorageUtils);
  });


  describe('Transcript Parsing and Pagination', () => {
    it('should parse raw transcript correctly and result in one page display in the transcript area, when available', async () => {
      // Mock storageUtils methods
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue('abcdefghijk');
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({ rawTranscript: '[00:00] Hello\n[00:05] World\n' });
  
      // Re-initialize with updated mocks
      await initializePopup(document, mockStorageUtils);
  
      expect(document.getElementById('transcript-display').textContent.trim()).toBe('[00:00] Hello\n[00:05] World');
    });

    it('if raw transcripts contains multiple segments, each segment should display in the transcript area, when available', async () => {
      // Mock storageUtils methods
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue('abcdefghijk');
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
        rawTranscript: '[00:00] page1\n[15:00] page2\n[30:00] page3\n'
      });
  
      // Re-initialize with updated mocks
      await initializePopup(document, mockStorageUtils);
  
      // Check the first segment is displayed initially
      expect(document.getElementById('transcript-display').textContent.trim()).toBe('[00:00] page1');
  
      // Simulate clicking the next button to go to the second segment
      document.getElementById('next-btn').click();
      expect(document.getElementById('transcript-display').textContent.trim()).toBe('[15:00] page2');
  
      // Simulate clicking the next button to go to the third segment
      document.getElementById('next-btn').click();
      expect(document.getElementById('transcript-display').textContent.trim()).toBe('[30:00] page3');
  
      // Simulate clicking the previous button to go back to the second segment
      document.getElementById('prev-btn').click();
      expect(document.getElementById('transcript-display').textContent.trim()).toBe('[15:00] page2');
    });

    
    it('should parse transcript correctly and result in three pages', () => {
      // Note this will fail if we update the SEGMENT_DURATION...
      const rawTranscript = 
        '[00:00] Start\n' +
        '[14:59] End of page 1\n' +
        '[15:00] Page 2\n' +
        '[29:59] End of page 2\n' +
        '[30:00] Page 3\n' +
        '[44:59] End of page 3\n' +
        '[45:00] Page 4\n' +
        '[59:59] End of page 4\n';
      const expected = [
        { timestamp: 0, text: 'Start' },
        { timestamp: 899, text: 'End of page 1' },
        { timestamp: 900, text: 'Page 2' },
        { timestamp: 1799, text: 'End of page 2' },
        { timestamp: 1800, text: 'Page 3' },
        { timestamp: 2699, text: 'End of page 3' },
        { timestamp: 2700, text: 'Page 4' },
        { timestamp: 3599, text: 'End of page 4' },
      ];

      const parsed = parseTranscript(rawTranscript);

      expect(parsed).toEqual(expected);

      // Paginate the transcript
      const paginatedSegments = paginateTranscript(); // Capture the returned segments

      // Validate pagination
      expect(paginatedSegments.length).toBe(4); // Three pages

      expect(paginatedSegments[0]).toBe('[00:00] Start\n[14:59] End of page 1');
      expect(paginatedSegments[1]).toBe('[15:00] Page 2\n[29:59] End of page 2');
      expect(paginatedSegments[2]).toBe('[30:00] Page 3\n[44:59] End of page 3');
      expect(paginatedSegments[3]).toBe('[45:00] Page 4\n[59:59] End of page 4');
    });
  });

  describe('Processed Transcript Handling', () => {
    it.only('should only pass one segment of raw transcript to the LLM API for processing', async () => {
      // Mock the raw transcript with multiple segments
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
        rawTranscript: '[00:00] Hello\n[00:05] World\n[00:10] Again\n',
      });
  
      // Re-initialize with updated mocks
      await initializePopup(document, mockStorageUtils);
  
      // Simulate clicking the process button
      const processBtn = document.getElementById('process-btn');
      processBtn.click();
  
      // Wait for the LLM API call to be made
      await new Promise(setImmediate);
  
      // Check that only the first segment was passed to the LLM API
      expect(mockLLMUtils.call_llm).toHaveBeenCalledWith(
        expect.any(String), // model
        expect.any(String), // system role
        '[00:00] Hello\n[00:05] World\n' // Only the first segment
      );
    });
  
    it('should reload the processed segment after it has been saved', async () => {
      // Mock the processed transcript
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
        rawTranscript: '[00:00] Hello\n[00:05] World\n',
        processedTranscript: '[00:00 -> 00:05]\nSpeaker1:\nHello\n[00:05 -> 00:10]\nSpeaker2:\nWorld\n'
      });
  
      // Re-initialize with updated mocks
      await initializePopup(document, mockStorageUtils);
  
      // Simulate clicking the process button
      const processBtn = document.getElementById('process-btn');
      processBtn.click();
  
      // Wait for the LLM API call to be made
      await new Promise(setImmediate);
  
      // Simulate saving the processed transcript
      const processedTranscript = '[00:00 -> 00:05]\nSpeaker1:\nHello\n[00:05 -> 00:10]\nSpeaker2:\nWorld\n';
      await mockStorageUtils.saveProcessedTranscriptById('abcdefghijk', processedTranscript);
  
      // Reload the popup to simulate a new session
      await initializePopup(document, mockStorageUtils);
  
      // Check that the processed transcript is reloaded correctly
      expect(document.getElementById('processed-display').textContent.trim()).toBe(
        '[00:00 -> 00:05]\nSpeaker1:\nHello\n[00:05 -> 00:10]\nSpeaker2:\nWorld'
      );
    });

    it('should save processed transcript correctly', async () => {
      const videoId = 'abcdefghijk';
      const processedTranscript = '[00:00 -> 00:05]\nSpeaker1: Hello\n[00:05 -> 00:10]\nSpeaker2: World';
      
      await mockStorageUtils.saveProcessedTranscriptById(videoId, processedTranscript);
      
      expect(mockStorageUtils.saveProcessedTranscriptById).toHaveBeenCalledWith(videoId, processedTranscript);
    });

    it('should load processed transcript correctly', async () => {
      const videoId = 'abcdefghijk';
      const processedTranscript = '[00:00 -> 00:05]\nSpeaker1: Hello\n[00:05 -> 00:10]\nSpeaker2: World';
      
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
        rawTranscript: '[00:00] Hello\n[00:05] World',
        processedTranscript: processedTranscript
      });

      await initializePopup(document, mockStorageUtils);

      expect(mockStorageUtils.loadTranscriptsById).toHaveBeenCalledWith(videoId);
      expect(document.getElementById('processed-display').textContent.trim()).toBe(processedTranscript);
    });

    it('should handle missing processed transcript', async () => {
      const videoId = 'abcdefghijk';
      
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
        rawTranscript: '[00:00] Hello\n[00:05] World',
        processedTranscript: null
      });

      await initializePopup(document, mockStorageUtils);

      expect(mockStorageUtils.loadTranscriptsById).toHaveBeenCalledWith(videoId);
      expect(document.getElementById('processed-display').textContent.trim()).toBe('Processed output will appear here.');
    });

    it('should update UI after processing a segment', async () => {
      const videoId = 'abcdefghijk';
      const rawTranscript = '[00:00] Hello\n[00:05] World';
      const processedSegment = '[00:00 -> 00:05]\nSpeaker1: Hello\n[00:05 -> 00:10]\nSpeaker2: World';
      
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({ rawTranscript });
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(videoId);

      await initializePopup(document, mockStorageUtils);

      // Mock LLM response
      const mockLLMUtils = require('../popup/llm_api_utils.js').default.mock.instances[0];
      mockLLMUtils.call_llm.mockResolvedValue(processedSegment);

      // Simulate clicking the process button
      document.getElementById('process-btn').click();

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLLMUtils.call_llm).toHaveBeenCalled();
      expect(mockStorageUtils.saveProcessedTranscriptById).toHaveBeenCalledWith(videoId, processedSegment);
      expect(document.getElementById('processed-display').textContent.trim()).toBe(processedSegment);
    });

    it('should handle errors when saving processed transcript', async () => {
      const videoId = 'abcdefghijk';
      const rawTranscript = '[00:00] Hello\n[00:05] World';
      const processedSegment = '[00:00 -> 00:05]\nSpeaker1: Hello\n[00:05 -> 00:10]\nSpeaker2: World';
      
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({ rawTranscript });
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(videoId);
      mockStorageUtils.saveProcessedTranscriptById.mockRejectedValue(new Error('Save failed'));

      await initializePopup(document, mockStorageUtils);

      // Mock LLM response
      const mockLLMUtils = require('../popup/llm_api_utils.js').default.mock.instances[0];
      mockLLMUtils.call_llm.mockResolvedValue(processedSegment);

      // Mock console.error and window.alert
      console.error = jest.fn();
      window.alert = jest.fn();

      // Simulate clicking the process button
      document.getElementById('process-btn').click();

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith('Error processing transcript:', expect.any(Error));
      expect(window.alert).toHaveBeenCalledWith('Failed to process the current segment.');
    });

    it('should toggle processed transcript segments correctly', async () => {
      // Mock the processed transcript
      global.processedSegments = [
        '[00:00 -> 00:05]\nSpeaker1:\nHello\n',
        '[00:05 -> 00:10]\nSpeaker2:\nWorld\n',
        '[00:10 -> 00:15]\nSpeaker1:\nAgain\n',
      ];
      global.currentSegmentIndex = 0;

      // Add processed display element to the DOM
      const processedDisplay = document.createElement('pre');
      processedDisplay.id = 'processed-display';
      document.body.appendChild(processedDisplay);

      // Add segment info element
      const segmentInfo = document.createElement('div');
      segmentInfo.id = 'segment-info';
      document.body.appendChild(segmentInfo);

      // Add next and prev buttons
      const nextBtn = document.createElement('button');
      nextBtn.id = 'next-btn';
      document.body.appendChild(nextBtn);

      const prevBtn = document.createElement('button');
      prevBtn.id = 'prev-btn';
      document.body.appendChild(prevBtn);

      // Setup pagination for processed segments
      const tabButtons = [];
      const tabContents = [];
      setupPagination(prevBtn, nextBtn);

      // Simulate active tab for processed transcript
      const tabContent = document.createElement('div');
      tabContent.id = 'processed-tab';
      tabContent.classList.remove('hidden');
      document.body.appendChild(tabContent);

      // Initial display
      displayRawOrProcessedSegment();
      expect(processedDisplay.textContent).toBe('[00:00 -> 00:05]\nSpeaker1:\nHello\n');
      expect(segmentInfo.textContent).toBe('Segment 1 of 3');

      // Click next to go to second segment
      nextBtn.click();
      expect(global.currentSegmentIndex).toBe(1);
      expect(processedDisplay.textContent).toBe('[00:05 -> 00:10]\nSpeaker2:\nWorld\n');
      expect(segmentInfo.textContent).toBe('Segment 2 of 3');

      // Click next to go to third segment
      nextBtn.click();
      expect(global.currentSegmentIndex).toBe(2);
      expect(processedDisplay.textContent).toBe('[00:10 -> 00:15]\nSpeaker1:\nAgain\n');
      expect(segmentInfo.textContent).toBe('Segment 3 of 3');

      // Click prev to go back to second segment
      prevBtn.click();
      expect(global.currentSegmentIndex).toBe(1);
      expect(processedDisplay.textContent).toBe('[00:05 -> 00:10]\nSpeaker2:\nWorld\n');
      expect(segmentInfo.textContent).toBe('Segment 2 of 3');
    });
  });



  it('should paginate transcript correctly', () => {
    // Assuming SEGMENT_DURATION is 15 * 60 (900 seconds)
    const transcriptData = [
      { timestamp: 0, text: 'Hello' },
      { timestamp: 5, text: 'World' },
      // Add more entries as needed
    ];

    // Set transcript and SEGMENT_DURATION
    global.transcript = transcriptData;
    global.SEGMENT_DURATION = 900;

    const segments = paginateTranscript();

    expect(segments.length).toBe(1);
    expect(segments[0]).toBe('[00:00] Hello\n[00:05] World\n');
  });


  it('should store processed transcripts correctly', async () => {
    const processedTranscript = 'Processed transcript content';
    await mockStorageUtils.saveProcessedTranscriptById('abcdefghijk', processedTranscript);

    expect(mockStorageUtils.saveProcessedTranscriptById).toHaveBeenCalledWith('abcdefghijk', processedTranscript);
  });

  it('should toggle raw transcripts prev/next pages responsively', async () => {
    // Set up DOM elements
    document.body.innerHTML = `
      <button id="prev-btn"></button>
      <button id="next-btn"></button>
      <pre id="transcript-display"></pre>
    `;

    const segments = ['Segment 1', 'Segment 2'];
    global.segments = segments;
    global.currentSegmentIndex = 0;

    // Simulate clicking next
    document.getElementById('next-btn').click();
    expect(global.currentSegmentIndex).toBe(1);
    expect(document.getElementById('transcript-display').textContent).toBe('Segment 2');

    // Simulate clicking prev
    document.getElementById('prev-btn').click();
    expect(global.currentSegmentIndex).toBe(0);
    expect(document.getElementById('transcript-display').textContent).toBe('Segment 1');
  });
});

