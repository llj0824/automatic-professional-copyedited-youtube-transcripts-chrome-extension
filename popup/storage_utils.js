// popup/storage_utils.js

/**
 * StorageUtils - Manages YouTube video transcript storage in Chrome's local storage.
 * 
 * Storage Format:
 * {
 *   "youtube_video:${videoId}": {
 *     rawTranscript: string | null,      // Original transcript with timestamps [MM:SS] or [HH:MM:SS]
 *     processedTranscript: string | null  // AI-processed transcript with time ranges and speakers
 *   }
 * }
 * 
 * Example Raw Transcript:
 * [0:01] hello world
 * [0:05] this is a test
 * 
 * Example Processed Transcript:
 * [0:01 -> 0:05]
 * Speaker:
 * Hello world. This is a test.
 */
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

  /**
   * Saves the font size setting to local storage
   * @param {number} fontSize - The font size in pixels
   * @returns {Promise<void>}
   */
  saveFontSize(fontSize) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'font_size': fontSize }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving font size:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Font size saved successfully:', fontSize);
          resolve();
        }
      });
    });
  }

  /**
   * Loads the saved font size setting from local storage
   * @returns {Promise<number>} - The saved font size or default value (12)
   */
  loadFontSize() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['font_size'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading font size:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const fontSize = result.font_size || 12; // Default to 12px if not set
          console.log('Font size loaded:', fontSize);
          resolve(fontSize);
        }
      });
    });
  }

  /**
   * Generates a storage key for highlights of a specific page
   * @param {string} videoId - The YouTube video ID
   * @param {number} pageNumber - The page number
   * @returns {string} - The formatted storage key
   */
  generateHighlightsKey(videoId, pageNumber) {
    return `${this.KEY_PREFIX}${videoId}:${pageNumber}:highlights`;
  }

  /**
   * Saves highlights for a specific page of a YouTube video
   * @param {string} videoId - The YouTube video ID
   * @param {number} pageNumber - The page number
   * @param {string} highlights - The highlights text to save
   * @returns {Promise<void>}
   */
  saveHighlightsById(videoId, pageNumber, highlights) {
    if (!videoId) {
      console.error('Invalid video ID. Cannot save highlights.');
      return Promise.reject('Invalid video ID.');
    }

    const storageKey = this.generateHighlightsKey(videoId, pageNumber);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [storageKey]: highlights }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving highlights:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Highlights saved successfully for Video ID: ${videoId}, Page: ${pageNumber}`);
          resolve();
        }
      });
    });
  }

  /**
   * Loads highlights for a specific page of a YouTube video
   * @param {string} videoId - The YouTube video ID
   * @param {number} pageNumber - The page number
   * @returns {Promise<string|null>} - The retrieved highlights or null if not found
   */
  loadHighlightsById(videoId, pageNumber) {
    if (!videoId) {
      console.error('Invalid video ID. Cannot load highlights.');
      return Promise.reject('Invalid video ID.');
    }

    const storageKey = this.generateHighlightsKey(videoId, pageNumber);

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading highlights:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const highlights = result[storageKey] || null;
          console.log(`Highlights loaded for Storage Key ${storageKey}:`, highlights);
          resolve(highlights);
        }
      });
    });
  }

  /**
   * Generates a storage key for a specific page of a processed transcript.
   * @param {string} videoId - The YouTube video ID.
   * @param {number} pageNumber - The page number (0-indexed).
   * @returns {string} - The formatted storage key.
   */
  generateProcessedPageKey(videoId, pageNumber) {
    return `${this.KEY_PREFIX}${videoId}:${pageNumber}:processed`;
  }

  /**
   * Saves a specific page of the processed transcript.
   * @param {string} videoId - The YouTube video ID.
   * @param {number} pageNumber - The page number (0-indexed).
   * @param {string} processedPageText - The processed transcript text for the page.
   * @returns {Promise<void>}
   */
  saveProcessedPageById(videoId, pageNumber, processedPageText) {
    if (!videoId) {
      console.error('Invalid video ID. Cannot save processed page.');
      return Promise.reject('Invalid video ID.');
    }
    if (typeof pageNumber !== 'number' || pageNumber < 0) {
      console.error('Invalid page number. Cannot save processed page.');
      return Promise.reject('Invalid page number.');
    }

    const storageKey = this.generateProcessedPageKey(videoId, pageNumber);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [storageKey]: processedPageText }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error saving processed page ${pageNumber}:`, chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Processed page ${pageNumber} saved successfully for Video ID: ${videoId}`);
          resolve();
        }
      });
    });
  }

  /**
   * Loads a specific page of the processed transcript.
   * @param {string} videoId - The YouTube video ID.
   * @param {number} pageNumber - The page number (0-indexed).
   * @returns {Promise<string|null>} - The retrieved processed page text or null if not found.
   */
  loadProcessedPageById(videoId, pageNumber) {
    if (!videoId) {
      console.error('Invalid video ID. Cannot load processed page.');
      return Promise.reject('Invalid video ID.');
    }
     if (typeof pageNumber !== 'number' || pageNumber < 0) {
      console.error('Invalid page number. Cannot load processed page.');
      return Promise.reject('Invalid page number.');
    }

    const storageKey = this.generateProcessedPageKey(videoId, pageNumber);

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Error loading processed page ${pageNumber}:`, chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const processedPageText = result[storageKey] || null;
          console.log(`Processed page ${pageNumber} loaded for Storage Key ${storageKey}:`, processedPageText ? processedPageText.substring(0, 50) + '...' : null); // Log snippet
          resolve(processedPageText);
        }
      });
    });
  }
}

export default StorageUtils;
