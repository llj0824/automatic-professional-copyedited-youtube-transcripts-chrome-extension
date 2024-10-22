/**
 * @file tests/popup.unit_tests.js
 * @description Unit tests for individual functions in popup.js
 */

import { 
  parseTranscript,
  paginateTranscript,
  displayRawOrProcessedSegment,
  handlePrevClick, 
  handleNextClick, 
  setupProcessButton, 
  setupLoadTranscriptButton,
  initializePopup
} from '../popup/popup.js';
import StorageUtils from '../popup/storage_utils.js';
import LLM_API_Utils from '../popup/llm_api_utils.js';
import { domMockSetup } from './domMockSetup.js';

// Mock StorageUtils methods
jest.mock('../popup/storage_utils.js', () => {
  return jest.fn().mockImplementation(() => ({
    getCurrentYouTubeVideoId: jest.fn(),
    loadTranscriptsById: jest.fn(),
    saveRawTranscriptById: jest.fn(),
    saveProcessedTranscriptById: jest.fn(),
  }));
});

// Mock LLM_API_Utils methods
jest.mock('../popup/llm_api_utils.js', () => {
  return jest.fn().mockImplementation(() => ({
    loadApiKeys: jest.fn(),
    call_llm: jest.fn(),
  }));
});

describe('Popup Unit Tests', () => {
  const mockVideoId= 'mockVideoId';
  const mockRawTranscript='mockRawTranscript';
  const mockProcessedTranscript='mockProcessedTranscript';
  const mockDocument = domMockSetup();
  let mockStorageUtils;
  let llmUtils;
  let mockYoutubeTranscriptRetriever;

  mockStorageUtils = {
    getCurrentYouTubeVideoId: jest.fn().mockResolvedValue(mockVideoId),
    loadTranscriptsById: jest.fn().mockResolvedValue({ rawTranscript: mockRawTranscript }),
    saveRawTranscriptById: jest.fn().mockResolvedValue(),
    saveProcessedTranscriptById: jest.fn().mockResolvedValue(),
  };

  mockYoutubeTranscriptRetriever = {
    fetchParsedTranscript: jest.fn().mockResolvedValue(mockRawTranscript),
  }

  beforeAll(() => {
    llmUtils = new LLM_API_Utils();
    initializePopup(
      mockDocument, // Pass the mock document directly
      mockStorageUtils, // Pass the mock storage utils directly
      mockYoutubeTranscriptRetriever // Pass the mock YouTube transcript retriever directly
    ); // instantiates the document elements
  });

  beforeEach(() => {
    global.transcript = [];
    global.rawTranscriptSegments = [];
    global.processedTranscriptSegments = [];
    global.currentSegmentIndex = 0;
    global.SEGMENT_DURATION = 900; // 15 minutes in seconds
  });

  describe('parseTranscript', () => {
    it('should correctly parse a simple transcript', () => {
      const rawTranscript = '[00:00] Hello\n[00:05] World';
      const expected = [
        { timestamp: 0, text: 'Hello' },
        { timestamp: 5, text: 'World' }
      ];
      expect(parseTranscript(rawTranscript)).toEqual(expected);
    });

    it('should handle empty input', () => {
      expect(parseTranscript('')).toEqual([]);
    });

    it('should handle malformed input', () => {
      const rawTranscript = 'Invalid transcript';
      expect(parseTranscript(rawTranscript)).toEqual([]);
    });
  });

  describe.only('paginateTranscript', () => {
    it('should correctly paginate a transcript with 1 total page', () => {
      const mockRawTranscript = [
        { timestamp: 0, text: 'Page 1' },
        { timestamp: 5, text: 'Page 1 continued' }
      ];
      const mockProcessedTranscript = [
        { timestamp: 0, text: 'Page 1' },
        { timestamp: 5, text: 'Page 1 continued' }
      ];
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
         rawTranscript: mockRawTranscript,
         processedTranscript: mockProcessedTranscript});
      const expected = [
        '[00:00] Page 1\n[00:05] Page 1 continued'
      ];
      const paginatedResult = paginateTranscript(mockRawTranscript, mockProcessedTranscript);
      expect(paginatedResult.rawTranscriptSegments).toEqual(expected);
      expect(paginatedResult.processedTranscriptSegments).toEqual(expected);
    });

    it('should correctly paginate a transcript with 3 total pages', () => {
      global.SEGMENT_DURATION = 900;
      const mockRawTranscript = [
        { timestamp: 0, text: 'Page 1' },
        { timestamp: 5, text: 'Page 1 continued' },
        { timestamp: 900, text: 'Page 2' },
        { timestamp: 1800, text: 'Page 3' }
      ];
      const mockProcessedTranscript = [
        { timestamp: 0, text: 'Page 1' },
        { timestamp: 5, text: 'Page 1 continued' },
        { timestamp: 900, text: 'Page 2' },
        { timestamp: 1800, text: 'Page 3' }
      ];
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
         rawTranscript: mockRawTranscript,
         processedTranscript: mockProcessedTranscript});
      const expected = [
        '[00:00] Page 1\n[00:05] Page 1 continued',
        '[15:00] Page 2',
        '[30:00] Page 3'
      ];
      const paginatedResult = paginateTranscript(mockRawTranscript, mockProcessedTranscript);
      expect(paginatedResult.rawTranscriptSegments).toEqual(expected);
      expect(paginatedResult.rawTranscriptSegments).toHaveLength(3);
      expect(paginatedResult.processedTranscriptSegments).toEqual(expected);
      expect(paginatedResult.processedTranscriptSegments).toHaveLength(3);

    });
  });

  describe('displayRawOrProcessedSegment', () => {
    beforeEach(() => {
      global.segments = ['Segment 1', 'Segment 2'];
      global.processedSegments = ['Processed 1', 'Processed 2'];
      global.currentSegmentIndex = 0;
    });

    it('should display raw segment when raw tab is active', () => {
      document.getElementById.mockReturnValueOnce({ classList: { contains: () => false } });
      displayRawOrProcessedSegment();
      expect(document.getElementById).toHaveBeenCalledWith('transcript-display');
      expect(document.getElementById).toHaveBeenCalledWith('segment-info');
    });

    it('should display processed segment when processed tab is active', () => {
      document.getElementById.mockReturnValueOnce({ classList: { contains: () => true } });
      displayRawOrProcessedSegment();
      expect(document.getElementById).toHaveBeenCalledWith('processed-display');
      expect(document.getElementById).toHaveBeenCalledWith('segment-info');
    });
  });

  describe('handlePrevClick and handleNextClick', () => {
    beforeEach(() => {
      global.rawTranscriptSegments = ['Segment 1', 'Segment 2', 'Segment 3'];
      global.currentSegmentIndex = 1;
    });

    it('should decrement the current segment index on prev click', () => {
      handlePrevClick();
      expect(global.currentSegmentIndex).toBe(0);
    });

    it('should increment the current segment index on next click', () => {
      handleNextClick();
      expect(global.currentSegmentIndex).toBe(2);
    });

    it('should not increment beyond the last segment', () => {
      global.currentSegmentIndex = 1;
      handleNextClick();
      expect(global.currentSegmentIndex).toBe(1);
    });
  });

  describe('Loading and Storing Transcripts', () => {
    it('should load raw and processed transcripts from storage', async () => {
      // Mock the YouTube video ID and transcripts
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue('video123');
      mockStorageUtils.loadTranscriptsById.mockResolvedValue({
        rawTranscript: '[00:00] Hello\n[00:05] World',
        processedTranscript: '[00:00 -> 00:05]\nSpeaker: Hello World',
      });

      // Mock DOM elements
      const transcriptInput = { value: '' };
      const transcriptDisplay = { textContent: '' };
      const processedDisplay = { textContent: '' };
      document.getElementById.mockImplementation((id) => {
        if (id === 'transcript-input') return transcriptInput;
        if (id === 'transcript-display') return transcriptDisplay;
        if (id === 'processed-display') return processedDisplay;
        return {};
      });

      // Call initializePopup
      await initializePopup(document, mockStorageUtils);

      // Check that the raw transcript was loaded into the input and display
      expect(transcriptInput.value).toBe('[00:00] Hello\n[00:05] World');
      expect(transcriptDisplay.textContent).toBe('[00:00] Hello\n[00:05] World');

      // Check that the processed transcript was loaded into the processed display
      expect(processedDisplay.textContent).toBe('[00:00 -> 00:05]\nSpeaker: Hello World');
    });

    it('should save raw transcript to storage', async () => {
      // Mock the YouTube video ID
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue('video123');

      // Mock DOM elements
      const transcriptInput = { value: '[00:00] Hello\n[00:05] World' };
      document.getElementById.mockImplementation((id) => {
        if (id === 'transcript-input') return transcriptInput;
        return {};
      });

      // Call the function to save the raw transcript
      const loadTranscriptBtn = { addEventListener: jest.fn((event, callback) => callback()) };
      await setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, mockStorageUtils);

      // Check that the raw transcript was saved to storage
      expect(mockStorageUtils.saveRawTranscriptById).toHaveBeenCalledWith('video123', '[00:00] Hello\n[00:05] World');
    });

    it('should save processed transcript to storage', async () => {
      // Mock the YouTube video ID
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue('video123');

      // Mock processed transcript segments
      global.processedTranscriptSegments = ['[00:00 -> 00:05]\nSpeaker: Hello World'];

      // Call the function to save the processed transcript
      const processBtn = { addEventListener: jest.fn((event, callback) => callback()) };
      await setupProcessButton(processBtn, { value: 'gpt-3' }, mockStorageUtils);

      // Check that the processed transcript was saved to storage
      expect(mockStorageUtils.saveProcessedTranscriptById).toHaveBeenCalledWith('video123', '[00:00 -> 00:05]\nSpeaker: Hello World');
    });

    it('should handle missing YouTube video ID when saving transcript', async () => {
      // Mock the YouTube video ID to return null
      mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(null);

      // Mock alert
      global.alert = jest.fn();

      // Call the function to save the raw transcript
      const loadTranscriptBtn = { addEventListener: jest.fn((event, callback) => callback()) };
      await setupLoadTranscriptButton(loadTranscriptBtn, { value: '[00:00] Hello\n[00:05] World' }, mockStorageUtils);

      // Check that the alert was called with the appropriate message
      expect(global.alert).toHaveBeenCalledWith('Unable to determine YouTube Video ID.');
    });
  });

  // Add more unit tests for other functions as needed
});
