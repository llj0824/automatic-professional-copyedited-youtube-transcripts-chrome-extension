/**
 * Note: Integration tests for popup.js would typically require a testing environment that can handle DOM manipulations and simulate user interactions.
 * Tools like Jest with jsdom or Puppeteer can be used for such purposes.
 * Below is a simplified example using Jest and jsdom.
 */

import StorageUtils from './storage_utils.js';
import { initializePopup, parseTranscript, paginateTranscript } from './popup.js';

// Mock dependencies
jest.mock('./storage_utils.js');

describe('Popup Integration Tests', () => {
  let storageUtils;

  beforeEach(() => {
    // Reset modules and mocks before each test
    jest.resetModules();
    storageUtils = new StorageUtils();
  });

  it('should initialize popup and load existing transcripts', async () => {
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
});