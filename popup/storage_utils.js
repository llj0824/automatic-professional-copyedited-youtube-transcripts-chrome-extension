// popup/storage_utils.js

class StorageUtils {
  constructor() {
    if (!chrome || !chrome.storage) {
      console.error('chrome.storage API is not available.');
      throw new Error('chrome.storage API is not available.');
    }
    this.KEY_PREFIX = 'youtube_video:'; // Prefix for human-readable keys
  }

  /**
   * Extracts the YouTube video ID from a given URL.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @returns {string|null} - The extracted video ID or null if invalid.
   */
  getVideoId(videoUrl) {
    console.log(`getVideoId called with URL: ${videoUrl}`);
    try {
      const url = new URL(videoUrl);
      const videoId = url.searchParams.get('v');
      console.log(`Extracted Video ID: ${videoId}`);
      return videoId;
    } catch (error) {
      console.error('Invalid video URL:', videoUrl, error);
      return null;
    }
  }

  /**
   * Generates a human-readable storage key for a YouTube video.
   * @param {string} videoId - The YouTube video ID.
   * @returns {string} - The formatted storage key.
   */
  generateStorageKey(videoId) {
    return `${this.KEY_PREFIX}${videoId}`;
  }

  /**
   * Saves the raw transcript for a specific YouTube video.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @param {string} rawTranscript - The raw transcript text to save.
   * @returns {Promise<void>}
   */
  saveRawTranscript(videoUrl, rawTranscript) {
    console.log(`saveRawTranscript called for URL: ${videoUrl}`);
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) {
      console.error('Invalid video URL. Cannot save raw transcript.');
      return Promise.reject('Invalid video URL.');
    }

    const storageKey = this.generateStorageKey(videoId);
    const data = {};
    data[storageKey] = { rawTranscript };

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        const existingData = result[storageKey] || {};
        const updatedData = { ...existingData, rawTranscript };
        data[storageKey] = updatedData;

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving raw transcript:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log('Raw transcript saved successfully for Video ID:', videoId);
            resolve();
          }
        });
      });
    });
  }

  /**
   * Saves the processed transcript for a specific YouTube video.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @param {string} processedTranscript - The processed transcript text to save.
   * @returns {Promise<void>}
   */
  saveProcessedTranscript(videoUrl, processedTranscript) {
    console.log(`saveProcessedTranscript called for URL: ${videoUrl}`);
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) {
      console.error('Invalid video URL. Cannot save processed transcript.');
      return Promise.reject('Invalid video URL.');
    }

    const storageKey = this.generateStorageKey(videoId);
    const data = {};
    data[storageKey] = { processedTranscript };

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        const existingData = result[storageKey] || {};
        const updatedData = { ...existingData, processedTranscript };
        data[storageKey] = updatedData;

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving processed transcript:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log('Processed transcript saved successfully for Video ID:', videoId);
            resolve();
          }
        });
      });
    });
  }

  /**
   * Loads both the raw and processed transcripts for a specific YouTube video.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @returns {Promise<{ rawTranscript: string|null, processedTranscript: string|null }>} 
   *          - The retrieved transcripts or null if not found.
   */
  loadTranscripts(videoUrl) {
    console.log(`loadTranscripts called for URL: ${videoUrl}`);
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) {
      console.error('Invalid video URL. Cannot load transcripts.');
      return Promise.reject('Invalid video URL.');
    }

    const storageKey = this.generateStorageKey(videoId);

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading transcripts:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const data = result[storageKey] || {};
          console.log(`Transcripts loaded for Storage Key ${storageKey}:`, data);
          resolve({
            rawTranscript: data.rawTranscript || null,
            processedTranscript: data.processedTranscript || null,
          });
        }
      });
    });
  }

  /**
   * Removes both the raw and processed transcripts for a specific YouTube video.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @returns {Promise<void>}
   */
  removeTranscripts(videoUrl) {
    console.log(`removeTranscripts called for URL: ${videoUrl}`);
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) {
      console.error('Invalid video URL. Cannot remove transcripts.');
      return Promise.reject('Invalid video URL.');
    }

    const storageKey = this.generateStorageKey(videoId);

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([storageKey], () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing transcripts:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Transcripts removed successfully for Storage Key:', storageKey);
          resolve();
        }
      });
    });
  }
}

export default StorageUtils;