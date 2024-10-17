/**
 * Note: Integration tests for popup.js would typically require a testing environment that can handle DOM manipulations and simulate user interactions.
 * Tools like Jest with jsdom or Puppeteer can be used for such purposes.
 * Below is a simplified example using Jest and jsdom.
 */

import { domMockSetup } from './domMockSetup';
// Set up the DOM before importing the module
beforeAll(() => {
  console.log('beforeAll')
  domMockSetup();
});
// import './setupJestMocks'; // Ensure this path is correct
import StorageUtils from '../popup/storage_utils.js';
import { initializePopup, parseTranscript, paginateTranscript } from '../popup/popup.js';
import LLM_API_Utils from '../popup/llm_api_utils.js';

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


beforeEach(() => {
  jest.clearAllMocks();

  // Reset any global variables if used
  global.segments = [];
  global.processedSegments = [];
  global.currentSegmentIndex = 0;
});

// Mock dependencies
jest.mock('../popup/storage_utils.js');

describe('Popup Integration Tests', () => {
  let storageUtils;

  beforeEach(() => {
    // Reset modules and mocks before each test
    jest.resetModules();
    storageUtils = new StorageUtils();
  });

  it.only('should initialize popup and load existing transcripts', async () => {
    // Set up DOM elements
    document.body.innerHTML = `
      <input id="transcript-input" />
      <textarea id="processed-display"></textarea>
    `;

    // Mock storageUtils methods
    storageUtils.getCurrentYouTubeVideoId = jest.fn().mockResolvedValue('abcdefghijk');
    storageUtils.loadTranscriptsById = jest.fn().mockResolvedValue({
      rawTranscript: '[00:00] Hello\n[00:05] World',
      processedTranscript: '[00:00 -> 00:05]\nSpeaker:\nHello World',
    });

    // Mock alert
    global.alert = jest.fn();

    // Initialize popup
    await initializePopup();

    // Assertions
    expect(storageUtils.getCurrentYouTubeVideoId).toHaveBeenCalled();
    expect(storageUtils.loadTranscriptsById).toHaveBeenCalledWith('abcdefghijk');
    expect(document.getElementById('transcript-input').value).toBe('[00:00] Hello\n[00:05] World');
    expect(document.getElementById('processed-display').textContent).toBe('[00:00 -> 00:05]\nSpeaker:\nHello World');
    expect(global.alert).toHaveBeenCalledWith('Raw transcript loaded from storage.');
  });

  it('should parse transcript correctly', () => {
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
    const transcript = [
      { timestamp: 0, text: 'Hello' },
      { timestamp: 5, text: 'World' },
      // Add more entries as needed
    ];

    // Set transcript and SEGMENT_DURATION
    global.transcript = transcript;
    global.SEGMENT_DURATION = 900;

    const segments = paginateTranscript();

    expect(segments.length).toBe(1);
    expect(segments[0]).toBe('[00:00] Hello\n[00:05] World\n');
  });

  it('should display loaded transcript in the transcript area', async () => {
    // Set up DOM elements
    document.body.innerHTML = `
      <textarea id="transcript-input"></textarea>
      <pre id="transcript-display"></pre>
    `;

    const rawTranscript = '[00:00] Hello\n[00:05] World';
    document.getElementById('transcript-input').value = rawTranscript;

    // Mock storageUtils methods
    storageUtils.getCurrentYouTubeVideoId = jest.fn().mockResolvedValue('abcdefghijk');
    storageUtils.loadTranscriptsById = jest.fn().mockResolvedValue({ rawTranscript });

    await initializePopup();

    expect(document.getElementById('transcript-display').textContent).toBe(rawTranscript);
  });

  it('should store processed responses correctly', async () => {
    // Mock storageUtils methods
    storageUtils.getCurrentYouTubeVideoId = jest.fn().mockResolvedValue('abcdefghijk');
    storageUtils.saveProcessedTranscriptById = jest.fn().mockResolvedValue();

    const processedTranscript = 'Processed transcript content';
    await storageUtils.saveProcessedTranscriptById('abcdefghijk', processedTranscript);

    expect(storageUtils.saveProcessedTranscriptById).toHaveBeenCalledWith('abcdefghijk', processedTranscript);
  });

  it('should toggle prev/next pages responsively', async () => {
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
