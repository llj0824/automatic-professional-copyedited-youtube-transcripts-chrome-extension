// clipServiceUtils.test.js

// Import the functions/classes to test
import { ClipRequestHandler, parseTimeString } from './clipServiceUtils.js';

// Mock the fetch API provided by jest-fetch-mock (setup in jest.setup.js)
// The fetchMock variable is globally available thanks to jest.setup.js

// Mock timers
jest.useFakeTimers();

describe('Clip Service Utilities', () => {
  
  describe('parseTimeString', () => {
    // TODO: Add tests for parseTimeString if needed
    test('should correctly parse HH:MM:SS', () => {
      expect(parseTimeString('01:02:03')).toBe(3723);
    });
    test('should correctly parse MM:SS', () => {
      expect(parseTimeString('05:30')).toBe(330);
    });
     test('should correctly parse SS', () => {
      expect(parseTimeString('45')).toBe(45);
    });
    test('should throw error for invalid format', () => {
      expect(() => parseTimeString('abc')).toThrow(/Invalid time format/);
      expect(() => parseTimeString('1:2:3:4')).toThrow(/Invalid time format/);
      expect(() => parseTimeString('1:70')).toThrow(/Invalid time format/); // Assuming validation catches this
    });
  });

  describe('ClipRequestHandler', () => {
    let mockUIElements;
    let mockConfig;
    let handler;

    // Runs before each test in this describe block
    beforeEach(() => {
      // Reset mocks provided by jest-fetch-mock and our global chrome mock
      fetchMock.resetMocks();
      chrome.downloads.download.mockClear();
      // Re-create mocks for UI elements to have fresh jest.fn() instances
      mockUIElements = {
        clipBtn: { classList: { add: jest.fn(), remove: jest.fn() } }, // Mock basic DOM methods if needed
        clipStartTimeInput: { value: '' }, // Can set value in tests
        clipEndTimeInput: { value: '' },
        clipStatus: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } },
        clipError: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } },
        clipLoader: { classList: { add: jest.fn(), remove: jest.fn() } }, // Mock loader if used by _updateStatus
      };
      mockConfig = {
        baseUrl: 'http://mockservice.com', // Use a mock URL
        apiKey: 'test-api-key'
      };
      handler = new ClipRequestHandler(mockUIElements, mockConfig);

      // Spy on internal methods we want to check are called, like _updateStatus or downloadFile
      // or simply check their side effects (UI changes, fetch calls)
      jest.spyOn(handler, '_updateStatus');
      jest.spyOn(handler, 'pollStatus');
      jest.spyOn(handler, 'downloadFile');
    });

    test('requestClip should handle successful flow', async () => {
      const videoUrl = 'https://youtube.com/watch?v=test1234';
      const startTime = '0:10';
      const endTime = '0:25'; // 15 seconds
      const taskId = 'task-123';
      const downloadUrl = 'http://mockservice.com/download/clip.mp4';
      const filename = 'test_video_clip.mp4';

      // Mock the API responses
      fetchMock.mockResponses(
        // 1. /get_video response
        [ JSON.stringify({ task_id: taskId }), { status: 200 } ],
        // 2. /status/{taskId} response (PENDING)
        [ JSON.stringify({ status: 'PENDING', progress: 50 }), { status: 200 } ],
        // 3. /status/{taskId} response (SUCCESS)
        [ JSON.stringify({ status: 'SUCCESS', result: { download_url: downloadUrl, filename: filename } }), { status: 200 } ]
      );

      // Trigger the request
      await handler.requestClip(videoUrl, startTime, endTime, 'test1234');

      // --- Assertions --- 

      // 1. Check initial API call (/get_video)
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(`${mockConfig.baseUrl}/get_video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: videoUrl,
          start_time: 10, // Parsed from '0:10'
          end_time: 25,   // Parsed from '0:25'
          api_key: mockConfig.apiKey
        })
      });

      // 2. Check _updateStatus calls
      expect(handler._updateStatus).toHaveBeenCalledWith('Validating input...', false, false);
      expect(handler._updateStatus).toHaveBeenCalledWith('Requesting clip...', true);
      expect(handler._updateStatus).toHaveBeenCalledWith('Processing...', true);

      // 3. Check that polling was initiated
      expect(handler.pollStatus).toHaveBeenCalledWith(taskId);

      // 4. Advance timers to simulate polling intervals
      // Need to wait for the interval to be set up (slight delay)
      await jest.advanceTimersByTimeAsync(10); // Small delay
      expect(fetchMock).toHaveBeenCalledTimes(2); // Initial + first poll
      expect(fetchMock).toHaveBeenNthCalledWith(2, `${mockConfig.baseUrl}/status/${taskId}`);
      expect(handler._updateStatus).toHaveBeenCalledWith('Status: PENDING...', true); 

      await jest.advanceTimersByTimeAsync(3000); // Advance by poll interval
      expect(fetchMock).toHaveBeenCalledTimes(3); // Second poll
      expect(fetchMock).toHaveBeenNthCalledWith(3, `${mockConfig.baseUrl}/status/${taskId}`);

      // 5. Check status update and download initiation after SUCCESS
      expect(handler._updateStatus).toHaveBeenCalledWith('Clip ready! Downloading...', false);
      expect(handler.downloadFile).toHaveBeenCalledWith(downloadUrl, filename);
      
      // 6. Check chrome.downloads call
      // Need to wait for the async download callback in the mock
      await jest.advanceTimersByTimeAsync(10); // Allow download mock callback to run
      expect(chrome.downloads.download).toHaveBeenCalledWith({
        url: downloadUrl,
        filename: filename
      }, expect.any(Function)); // Check callback is passed
      expect(handler._updateStatus).toHaveBeenCalledWith('Download started.', false, false);
    });

    // TODO: Add test for requestClip with invalid time input
    // TODO: Add test for requestClip when /get_video fails
    // TODO: Add test for pollStatus when status is FAILURE
    // TODO: Add test for pollStatus timeout
    // TODO: Add test for downloadFile when chrome.downloads fails
  });
});
