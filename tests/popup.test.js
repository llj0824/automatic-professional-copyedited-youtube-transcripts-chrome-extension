/**
 * @file tests/popup.test.js
 * @description Updated integration tests for popup.js utilizing domMockSetup from setupJestMocks.js
 */

import StorageUtils from '../popup/storage_utils.js';
import { initializePopup, parseTranscript, paginateTranscript } from '../popup/popup.js';

// Import the setup for Jest mocks, including DOM setup
import './setupJestMocks.js';

// Mock LLM_API_Utils
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

  beforeEach(() => {
    // Reset modules and mocks before each test
    jest.resetModules();
    jest.clearAllMocks();

    // Create a mock instance of StorageUtils
    mockStorageUtils = {
      getCurrentYouTubeVideoId: jest.fn().mockResolvedValue('abcdefghijk'),
      loadTranscriptsById: jest.fn().mockResolvedValue({ rawTranscript: '[00:00] Hello\n[00:05] World' }),
      saveRawTranscriptById: jest.fn().mockResolvedValue(),
      saveProcessedTranscriptById: jest.fn().mockResolvedValue(),
    };

    // Reset any global variables if used
    global.segments = [];
    global.processedSegments = [];
    global.currentSegmentIndex = 0;

    // Initialize the popup with the mocked DOM and injected storageUtils
    initializePopup(document, mockStorageUtils);
  });

  it.only('should parse transcript correctly', () => {
    const rawTranscript = '[00:00] Hello\n[00:05] World';
    const expected = [
      { timestamp: 0, text: 'Hello' },
      { timestamp: 5, text: 'World' },
    ];

    const parsed = parseTranscript(rawTranscript);

    expect(parsed).toEqual(expected);
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

  it.only('raw transcript automatically should display in the transcript area, when available', async () => {
    // Mock storageUtils methods
    mockStorageUtils.getCurrentYouTubeVideoId.mockResolvedValue('abcdefghijk');
    mockStorageUtils.loadTranscriptsById.mockResolvedValue({ rawTranscript: '[00:00] Hello\n[00:05] World\n' });

    // Re-initialize with updated mocks
    await initializePopup(document, mockStorageUtils);

    expect(document.getElementById('transcript-display').textContent.trim()).toBe('[00:00] Hello\n[00:05] World');
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
