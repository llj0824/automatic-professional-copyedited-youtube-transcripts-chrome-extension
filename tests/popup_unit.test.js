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
    // Reset all mocks before each test
    jest.clearAllMocks();
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

  describe('paginateTranscript', () => {
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


  describe('Loading, Storing, and retrieving Transcripts', () => {
    beforeAll(() => {
      // Mock DOM elements - TODO: refactor all tests to use this..type of mocking
      document.getElementById = jest.fn((id) => {
        const elements = {
          'transcript-input': { value: '' },
          'transcript-display': { textContent: '' },
          'processed-display': { textContent: '' },
          'prev-btn': { disabled: false, addEventListener: jest.fn() },
          'next-btn': { disabled: false, addEventListener: jest.fn() },
          'segment-info': { textContent: '' },
          'process-btn': { addEventListener: jest.fn() },
          'loader': { classList: { remove: jest.fn(), add: jest.fn() } },
          'tab-buttons': {},
          'tab-contents': {},
          'openai-api-key': { value: '' },
          'anthropic-api-key': { value: '' },
          'save-keys-btn': { addEventListener: jest.fn() },
          'model-select': { value: 'gpt-3' },
          'load-transcript-btn': { addEventListener: jest.fn() },
        };
        return elements[id] || {};
      });

      document.querySelectorAll = jest.fn((selector) => {
        // Return an array of mock buttons or contents based on selector
        if (selector === '.tab-button') {
          return [{ addEventListener: jest.fn() }];
        }
        if (selector === '.tab-content') {
          return [{ classList: { add: jest.fn(), remove: jest.fn() } }];
        }
        return [];
      });
      
      // Mock global alert and console
      global.alert = jest.fn();
      global.console = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
    });
    describe.only('Displaying and Saving Transcripts', () => {
      const mockRawTranscript = '[00:00] Hello\n[00:05] World';
      const mockProcessedTranscript = '[00:00 -> 00:05]\nSpeaker: Hello World';

      it('should load raw and processed transcripts from storage', async () => {
        // Mock the YouTube video ID and transcripts
        mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(mockVideoId);
        mockStorageUtils.loadTranscriptsById.mockResolvedValue({
          rawTranscript: mockRawTranscript,
          processedTranscript: mockProcessedTranscript,
        });

        const transcriptInput = { value: '' };
        const transcriptDisplay = { textContent: '' };
        const processedDisplay = { textContent: '' };
        document.getElementById.mockImplementation((id) => {
          if (id === 'transcript-input') return transcriptInput;
          if (id === 'transcript-display') return transcriptDisplay;
          if (id === 'processed-display') return processedDisplay;
          return {};
        });

        await initializePopup(document, mockStorageUtils, mockYoutubeTranscriptRetriever);

        // Check that the raw transcript was loaded into the input and display
        expect(transcriptInput.value).toBe(mockRawTranscript);
        expect(transcriptDisplay.textContent).toBe(mockRawTranscript);

        // Check that the processed transcript was loaded and paginated
        expect(processedDisplay.textContent).toBe(mockProcessedTranscript);
      });

      it('should save raw transcript to storage', async () => {
        // Mock the YouTube video ID
        mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(mockVideoId);

        // Mock DOM elements
        const transcriptInput = { value: mockRawTranscript };
        document.getElementById.mockImplementation((id) => {
          if (id === 'transcript-input') return transcriptInput;
          return {};
        });

        // Mock chrome storage set
        chrome.storage = {
          local: {
            get: jest.fn((keys, callback) => callback({})),
            set: jest.fn((data, callback) => callback()),
          },
        };

        // Call the function to save the raw transcript
        const loadTranscriptBtn = { addEventListener: jest.fn((event, callback) => callback()) };
        await setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, mockStorageUtils);

        // Check that the raw transcript was saved to storage
        expect(mockStorageUtils.saveRawTranscriptById).toHaveBeenCalledWith(mockVideoId, mockRawTranscript);
        expect(global.alert).toHaveBeenCalledWith('Transcript loaded and saved successfully!');
      });

      it('should save processed transcript to storage', async () => {
        // Mock the YouTube video ID
        mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(mockVideoId);

        // Mock processed transcript segments
        const newProcessedSegment = '[00:05 -> 00:10]\nSpeaker: How are you?';
        let processedTranscriptSegments = [mockProcessedTranscript, newProcessedSegment];
        let processedTranscriptCombined = processedTranscriptSegments.join('\n');

        // Mock processing response
        llmUtils.call_llm = jest.fn().mockResolvedValue(newProcessedSegment);

        // Mock chrome storage set
        chrome.storage = {
          local: {
            get: jest.fn((keys, callback) => callback({})),
            set: jest.fn((data, callback) => callback()),
          },
        };

        // Set initial processed transcript
        processedTranscript = mockProcessedTranscript;
        processedTranscriptSegments = paginateTranscript(parseTranscript(mockRawTranscript), processedTranscript);

        // Call the function to save the processed transcript
        const processBtn = { addEventListener: jest.fn((event, callback) => callback()) };
        await setupProcessButton(processBtn, { value: 'gpt-3' }, mockStorageUtils);

        // Check that the processed transcript was saved to storage
        expect(mockStorageUtils.saveProcessedTranscriptById).toHaveBeenCalledWith(mockVideoId, processedTranscriptCombined);
        expect(global.alert).toHaveBeenCalledWith('Current segment processed successfully!');
      });

      it('should handle missing YouTube video ID when saving transcript', async () => {
        // Mock the YouTube video ID to return null
        mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue(null);

        // Mock DOM elements
        const transcriptInput = { value: mockRawTranscript };
        document.getElementById.mockImplementation((id) => {
          if (id === 'transcript-input') return transcriptInput;
          return {};
        });

        // Call the function to save the raw transcript
        const loadTranscriptBtn = { addEventListener: jest.fn((event, callback) => callback()) };
        await setupLoadTranscriptButton(loadTranscriptBtn, transcriptInput, mockStorageUtils);

        // Check that the alert was called with the appropriate message
        expect(global.alert).toHaveBeenCalledWith('No transcript available to process.');
      });
    });

    describe('Pagination Logic', () => {
      const mockRawTranscript = `
  [00:00] Hello
  [00:05] World
  [00:10] How are you?
  [00:15] I'm fine, thanks!
  [00:20] Great to hear.
      `;

      const mockProcessedTranscript = `
  [00:00 -> 00:05]
  Speaker: Hello
  [00:05 -> 00:10]
  Speaker: World
  [00:10 -> 00:15]
  Speaker: How are you?
  [00:15 -> 00:20]
  Speaker: I'm fine, thanks!
  [00:20 -> 00:25]
  Speaker: Great to hear.
      `;

      it('should correctly paginate raw transcript based on SEGMENT_DURATION', () => {
        // Set SEGMENT_DURATION to 15 seconds for testing
        SEGMENT_DURATION = 15;

        parseTranscript(mockRawTranscript);
        paginateTranscript(rawTranscript, mockProcessedTranscript);

        expect(rawTranscriptSegments).toHaveLength(2);
        expect(rawTranscriptSegments[0]).toBe(`[00:00] Hello\n[00:05] World\n[00:10] How are you?`);
        expect(rawTranscriptSegments[1]).toBe(`[00:15] I'm fine, thanks!\n[00:20] Great to hear.`);
      });

      it('should correctly paginate processed transcript based on SEGMENT_DURATION', () => {
        // Set SEGMENT_DURATION to 20 seconds for testing
        SEGMENT_DURATION = 20;

        parseTranscript(mockRawTranscript);
        paginateTranscript(rawTranscript, mockProcessedTranscript);

        expect(processedTranscriptSegments).toHaveLength(2);
        expect(processedTranscriptSegments[0]).toBe(`[00:00 -> 00:05]
  Speaker: Hello
  [00:05 -> 00:10]
  Speaker: World
  [00:10 -> 00:15]
  Speaker: How are you?`);
        expect(processedTranscriptSegments[1]).toBe(`[00:15 -> 00:20]
  Speaker: I'm fine, thanks!
  [00:20 -> 00:25]
  Speaker: Great to hear.`);
      });

      it('should handle transcripts that perfectly fit into segments', () => {
        // Adjust mock transcripts to fit exactly into segments
        const exactRaw = `
  [00:00] Line 1
  [00:10] Line 2
  [00:20] Line 3
  [00:30] Line 4
        `;

        const exactProcessed = `
  [00:00 -> 00:10]
  Speaker: Line 1
  [00:10 -> 00:20]
  Speaker: Line 2
  [00:20 -> 00:30]
  Speaker: Line 3
  [00:30 -> 00:40]
  Speaker: Line 4
        `;

        SEGMENT_DURATION = 20;

        parseTranscript(exactRaw);
        paginateTranscript(rawTranscript, exactProcessed);

        expect(rawTranscriptSegments).toHaveLength(2);
        expect(rawTranscriptSegments[0]).toBe(`[00:00] Line 1\n[00:10] Line 2`);
        expect(rawTranscriptSegments[1]).toBe(`[00:20] Line 3\n[00:30] Line 4`);

        expect(processedTranscriptSegments).toHaveLength(2);
        expect(processedTranscriptSegments[0]).toBe(`[00:00 -> 00:10]
  Speaker: Line 1
  [00:10 -> 00:20]
  Speaker: Line 2`);
        expect(processedTranscriptSegments[1]).toBe(`[00:20 -> 00:30]
  Speaker: Line 3
  [00:30 -> 00:40]
  Speaker: Line 4`);
      });

      it('should handle transcripts with varying segment sizes due to SEGMENT_DURATION changes', () => {
        // Initial pagination
        SEGMENT_DURATION = 15;
        parseTranscript(mockRawTranscript);
        paginateTranscript(rawTranscript, mockProcessedTranscript);

        expect(rawTranscriptSegments).toHaveLength(2);
        expect(processedTranscriptSegments).toHaveLength(2);

        // Change SEGMENT_DURATION and re-paginate
        SEGMENT_DURATION = 10;
        paginateTranscript(rawTranscript, mockProcessedTranscript);

        expect(rawTranscriptSegments).toHaveLength(3);
        expect(rawTranscriptSegments[0]).toBe(`[00:00] Hello\n[00:05] World`);
        expect(rawTranscriptSegments[1]).toBe(`[00:10] How are you?`);
        expect(rawTranscriptSegments[2]).toBe(`[00:15] I'm fine, thanks!\n[00:20] Great to hear.`);

        expect(processedTranscriptSegments).toHaveLength(3);
        expect(processedTranscriptSegments[0]).toBe(`[00:00 -> 00:05]
  Speaker: Hello
  [00:05 -> 00:10]
  Speaker: World`);
        expect(processedTranscriptSegments[1]).toBe(`[00:10 -> 00:15]
  Speaker: How are you?`);
        expect(processedTranscriptSegments[2]).toBe(`[00:15 -> 00:20]
  Speaker: I'm fine, thanks!
  [00:20 -> 00:25]
  Speaker: Great to hear.`);
      });
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


  // Add more unit tests for other functions as needed
});

