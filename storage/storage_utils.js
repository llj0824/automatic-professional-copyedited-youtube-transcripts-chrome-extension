// storage/storage_utils.js

class StorageUtils {
  constructor() {
    if (!chrome || !chrome.storage) {
      throw new Error('chrome.storage API is not available.');
    }
  }

  /**
   * Extracts the YouTube video ID from a given URL.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @returns {string|null} - The extracted video ID or null if invalid.
   */
  getVideoId(videoUrl) {
    try {
      const url = new URL(videoUrl);
      return url.searchParams.get('v');
    } catch (error) {
      console.error('Invalid video URL:', videoUrl);
      return null;
    }
  }

  /**
   * Saves the raw transcript for a specific YouTube video.
   * @param {string} videoUrl - The full URL of the YouTube video.
   * @param {string} rawTranscript - The raw transcript text to save.
   * @returns {Promise<void>}
   * @example
   * {
   *   "videoId": {
   *     "rawTranscript": "Raw transcript text...",
   *     "processedTranscript": "Processed transcript text..."
   *   },
   *   ...
   * }
   */
  saveRawTranscript(videoUrl, rawTranscript) {
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) return Promise.reject('Invalid video URL.');

    return new Promise((resolve, reject) => {
      const data = {};
      data[videoId] = { rawTranscript };
      chrome.storage.local.get([videoId], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        const existingData = result[videoId] || {};
        const updatedData = { ...existingData, rawTranscript };
        data[videoId] = updatedData;

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving raw transcript:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
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
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) return Promise.reject('Invalid video URL.');

    return new Promise((resolve, reject) => {
      const data = {};
      data[videoId] = { processedTranscript };
      chrome.storage.local.get([videoId], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        const existingData = result[videoId] || {};
        const updatedData = { ...existingData, processedTranscript };
        data[videoId] = updatedData;

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving processed transcript:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
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
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) return Promise.reject('Invalid video URL.');

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([videoId], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading transcripts:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const data = result[videoId] || {};
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
    const videoId = this.getVideoId(videoUrl);
    if (!videoId) return Promise.reject('Invalid video URL.');

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([videoId], () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing transcripts:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

export default StorageUtils;
