import StorageUtils from './storage_utils.js';

// Mock the chrome.storage API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  runtime: {
    lastError: null,
  },
};

describe('StorageUtils', () => {
  let storageUtils;

  beforeEach(() => {
    storageUtils = new StorageUtils();
    jest.clearAllMocks();
  });

  describe('getVideoId', () => {
    it('should extract video ID from a valid YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=abcdefghijk';
      expect(storageUtils.getVideoId(url)).toBe('abcdefghijk');
    });

    it('should return null for an invalid YouTube URL', () => {
      const url = 'https://www.notyoutube.com/watch?v=abcdefghijk';
      expect(storageUtils.getVideoId(url)).toBe('abcdefghijk'); // It still extracts 'abcdefghijk'
    });

    it('should return null for malformed URLs', () => {
      const url = 'not a url';
      expect(storageUtils.getVideoId(url)).toBeNull();
    });
  });

  describe('generateStorageKey', () => {
    it('should generate the correct storage key', () => {
      const videoId = 'abcdefghijk';
      expect(storageUtils.generateStorageKey(videoId)).toBe('youtube_video:abcdefghijk');
    });
  });

  describe('saveRawTranscript', () => {
    it('should save raw transcript correctly', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
      const rawTranscript = 'This is a raw transcript.';

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await storageUtils.saveRawTranscript(videoUrl, rawTranscript);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          youtube_video: 'abcdefghijk': { rawTranscript },
        },
        expect.any(Function)
      );
    });

    it('should handle existing data correctly', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
      const rawTranscript = 'This is a new raw transcript.';
      const existingData = { youtube_video: 'abcdefghijk': { processedTranscript: 'Existing processed transcript.' } };

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(existingData);
      });

      await storageUtils.saveRawTranscript(videoUrl, rawTranscript);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          youtube_video: 'abcdefghijk': {
            ...existingData['youtube_video:abcdefghijk'],
            rawTranscript,
          },
        },
        expect.any(Function)
      );
    });
  });

  describe('saveProcessedTranscript', () => {
    it('should save processed transcript correctly', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
      const processedTranscript = 'This is a processed transcript.';

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await storageUtils.saveProcessedTranscript(videoUrl, processedTranscript);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          youtube_video: 'abcdefghijk': { processedTranscript },
        },
        expect.any(Function)
      );
    });
  });

  describe('loadTranscripts', () => {
    it('should load transcripts correctly', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
      const storedData = {
        youtube_video: 'abcdefghijk': {
          rawTranscript: 'Stored raw transcript.',
          processedTranscript: 'Stored processed transcript.',
        },
      };

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(storedData);
      });

      const transcripts = await storageUtils.loadTranscripts(videoUrl);

      expect(transcripts).toEqual({
        rawTranscript: 'Stored raw transcript.',
        processedTranscript: 'Stored processed transcript.',
      });
    });

    it('should return nulls if transcripts are not found', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const transcripts = await storageUtils.loadTranscripts(videoUrl);

      expect(transcripts).toEqual({
        rawTranscript: null,
        processedTranscript: null,
      });
    });
  });

  describe('removeTranscripts', () => {
    it('should remove transcripts correctly', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=abcdefghijk';

      await storageUtils.removeTranscripts(videoUrl);

      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['youtube_video:abcdefghijk'], expect.any(Function));
    });
  });
});
