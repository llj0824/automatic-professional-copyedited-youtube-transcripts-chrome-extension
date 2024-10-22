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
   * Extracts the YouTube video ID from the current active tab.
   * @returns {Promise<string|null>} - The extracted video ID or null if invalid.
   */
  getCurrentYouTubeVideoId() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError);
          return resolve(null);
        }
        if (tabs.length === 0) {
          console.error('No active tab found.');
          return resolve(null);
        }

        const activeTab = tabs[0];
        const url = activeTab.url ? new URL(activeTab.url) : null;
        const videoId = url ? url.searchParams.get('v') : null;
        if (videoId) {
          return resolve(videoId);
        } else {
          console.error('Video ID not found in URL.');
          return resolve(null);
        }
      });
    });
  }

  /**
   * Generates a storage key for a YouTube video.
   * @param {string} videoId - The YouTube video ID.
   * @returns {string} - The formatted storage key.
   */
  generateStorageKey(videoId) {
    return `${this.KEY_PREFIX}${videoId}`;
  }

  /**
   * Saves the raw transcript for a specific YouTube video by video ID.
   * @param {string} videoId - The YouTube video ID.
   * @param {string} rawTranscript - The raw transcript text to save.
   * @returns {Promise<void>}
   */
  saveRawTranscriptById(videoId, rawTranscript) {
    console.log(`saveRawTranscriptById called for Video ID: ${videoId}`);
    if (!videoId) {
      console.error('Invalid video ID. Cannot save raw transcript.');
      return Promise.reject('Invalid video ID.');
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
   * @param {string} videoId - The YouTube video ID.
   * @param {string} processedTranscript - The processed transcript text to save.
   * @returns {Promise<void>}
   */
  saveProcessedTranscriptById(videoId, processedTranscript) {
    console.log(`saveProcessedTranscriptById called for Video ID: ${videoId}`);
    if (!videoId) {
      console.error('Invalid video ID. Cannot save processed transcript.');
      return Promise.reject('Invalid video ID.');
    }

    const storageKey = this.generateStorageKey(videoId);

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        const existingData = result[storageKey] || {};
        const updatedData = { ...existingData, processedTranscript };

        chrome.storage.local.set({ [storageKey]: updatedData }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving processed transcript:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log(`Processed transcript saved successfully for Video ID: ${videoId}`);
            resolve();
          }
        });
      });
    });
  }

  /**
   * Loads both the raw and processed transcripts for a specific YouTube video by video ID.
   * @param {string} videoId - The YouTube video ID.
   * @returns {Promise<{ rawTranscript: string|null, processedTranscript: string|null }>} 
   *          - The retrieved transcripts or null if not found.
   */
  loadTranscriptsById(videoId) {
    console.log(`loadTranscriptsById called for Video ID: ${videoId}`);
    if (!videoId) {
      console.error('Invalid video ID. Cannot load transcripts.');
      return Promise.reject('Invalid video ID.');
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
   * Removes both the raw and processed transcripts for a specific YouTube video by video ID.
   * @param {string} videoId - The YouTube video ID.
   * @returns {Promise<void>}
   */
  removeTranscriptsById(videoId) {
    console.log(`removeTranscriptsById called for Video ID: ${videoId}`);
    if (!videoId) {
      console.error('Invalid video ID. Cannot remove transcripts.');
      return Promise.reject('Invalid video ID.');
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
