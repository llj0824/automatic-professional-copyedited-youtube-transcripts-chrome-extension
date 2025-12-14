// popup/storage_utils.js
import { UI_DEFAULTS, LLM_DEFAULTS } from './config.js';

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
    this.METADATA_KEY = `${this.KEY_PREFIX}__metadata`; // Tracks last-updated timestamps
    this.EVICTION_FRACTION = 0.65; // Remove ~65% of oldest entries when over quota
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
   * Detects quota errors from chrome.runtime.lastError
   */
  isQuotaError(error) {
    const msg = (error && error.message) ? error.message.toLowerCase() : String(error).toLowerCase();
    return msg.includes('quota');
  }

  /**
   * Runs a storage operation and retries once after evicting old entries on quota errors.
   * @param {Function} operationFn - Function returning a Promise for the storage operation.
   * @returns {Promise<void>}
   */
  async runWithEviction(operationFn) {
    try {
      return await operationFn();
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn('Quota exceeded. Evicting old entries...');
        await this.evictOldEntries();
        return operationFn();
      }
      throw error;
    }
  }

  /**
   * Removes the oldest stored entries (based on last update time) to free space.
   * Deletes roughly EVICTION_FRACTION of the oldest items with the KEY_PREFIX.
   */
  evictOldEntries() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (allItems) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const metadata = allItems[this.METADATA_KEY] || {};
        const prefixedKeys = Object.keys(allItems).filter(
          (key) => key.startsWith(this.KEY_PREFIX) && key !== this.METADATA_KEY
        );

        if (prefixedKeys.length === 0) {
          console.warn('No entries to evict.');
          resolve();
          return;
        }

        const datedKeys = prefixedKeys.map((key) => ({
          key,
          updatedAt: metadata[key] || (allItems[key] && allItems[key]._updatedAt) || 0,
        }));

        datedKeys.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));

        const deleteCount = Math.max(1, Math.ceil(datedKeys.length * this.EVICTION_FRACTION));
        const keysToDelete = datedKeys.slice(0, deleteCount).map((entry) => entry.key);

        chrome.storage.local.remove(keysToDelete, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          const updatedMetadata = { ...metadata };
          keysToDelete.forEach((key) => {
            delete updatedMetadata[key];
          });

          chrome.storage.local.set({ [this.METADATA_KEY]: updatedMetadata }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              console.warn(`Evicted ${keysToDelete.length} entries to free storage space.`);
              resolve();
            }
          });
        });
      });
    });
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
      chrome.storage.local.get([storageKey, this.METADATA_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        const existingData = result[storageKey] || {};
        const metadata = result[this.METADATA_KEY] || {};
        const updatedAt = Date.now();
        const updatedData = { ...existingData, rawTranscript, _updatedAt: updatedAt };
        const updatedMetadata = { ...metadata, [storageKey]: updatedAt };
        data[storageKey] = updatedData;
        data[this.METADATA_KEY] = updatedMetadata;

        const attemptSave = () =>
          new Promise((innerResolve, innerReject) => {
            chrome.storage.local.set(data, () => {
              if (chrome.runtime.lastError) {
                innerReject(chrome.runtime.lastError);
              } else {
                innerResolve();
              }
            });
          });

        this.runWithEviction(attemptSave)
          .then(() => {
            console.log('Raw transcript saved successfully for Video ID:', videoId);
            resolve();
          })
          .catch((error) => {
            console.error('Error saving raw transcript:', error);
            reject(error);
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
      chrome.storage.local.get([storageKey, this.METADATA_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving existing data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        const existingData = result[storageKey] || {};
        const metadata = result[this.METADATA_KEY] || {};
        const updatedAt = Date.now();
        const updatedData = { ...existingData, processedTranscript, _updatedAt: updatedAt };
        const updatedMetadata = { ...metadata, [storageKey]: updatedAt };

        const attemptSave = () =>
          new Promise((innerResolve, innerReject) => {
            chrome.storage.local.set(
              { [storageKey]: updatedData, [this.METADATA_KEY]: updatedMetadata },
              () => {
                if (chrome.runtime.lastError) {
                  innerReject(chrome.runtime.lastError);
                } else {
                  innerResolve();
                }
              }
            );
          });

        this.runWithEviction(attemptSave)
          .then(() => {
            console.log(`Processed transcript saved successfully for Video ID: ${videoId}`);
            resolve();
          })
          .catch((error) => {
            console.error('Error saving processed transcript:', error);
            reject(error);
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
      chrome.storage.local.get([this.METADATA_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading metadata:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        const metadata = result[this.METADATA_KEY] || {};
        delete metadata[storageKey];

        chrome.storage.local.remove([storageKey], () => {
          if (chrome.runtime.lastError) {
            console.error('Error removing transcripts:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }

          chrome.storage.local.set({ [this.METADATA_KEY]: metadata }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error updating metadata after removal:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              console.log('Transcripts removed successfully for Storage Key:', storageKey);
              resolve();
            }
          });
        });
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
          const fontSize = result.font_size || UI_DEFAULTS.fontSizePx; // Centralized default
          console.log('Font size loaded:', fontSize);
          resolve(fontSize);
        }
      });
    });
  }

  /**
   * Saves the language preference to local storage
   * @param {string} language - The language code (e.g., 'en', 'zh-CN', 'es')
   * @returns {Promise<void>}
   */
  saveLanguagePreference(language) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'language_preference': language }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving language preference:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Language preference saved successfully:', language);
          resolve();
        }
      });
    });
  }

  /**
   * Loads the language preference from local storage
   * @returns {Promise<string>} - The language code (default 'en')
   */
  loadLanguagePreference() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['language_preference'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading language preference:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const language = result.language_preference || UI_DEFAULTS.languageCode; // Centralized default
          console.log('Language preference loaded:', language);
          resolve(language);
        }
      });
    });
  }

  /**
   * Persists the preferred LLM model to local storage
   * @param {string} modelName
   * @returns {Promise<void>}
   */
  saveModelPreference(modelName) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'llm_model_preference': modelName }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving model preference:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Model preference saved successfully:', modelName);
          resolve();
        }
      });
    });
  }

  /**
   * Loads the preferred LLM model from local storage
   * @returns {Promise<string>}
   */
  loadModelPreference() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['llm_model_preference'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading model preference:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          const modelName = result.llm_model_preference || LLM_DEFAULTS.defaultModel;
          console.log('Model preference loaded:', modelName);
          resolve(modelName);
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
      chrome.storage.local.get([this.METADATA_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving metadata:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        const metadata = result[this.METADATA_KEY] || {};
        const updatedMetadata = { ...metadata, [storageKey]: Date.now() };

        const attemptSave = () =>
          new Promise((innerResolve, innerReject) => {
            chrome.storage.local.set(
              { [storageKey]: highlights, [this.METADATA_KEY]: updatedMetadata },
              () => {
                if (chrome.runtime.lastError) {
                  innerReject(chrome.runtime.lastError);
                } else {
                  innerResolve();
                }
              }
            );
          });

        this.runWithEviction(attemptSave)
          .then(() => {
            console.log(`Highlights saved successfully for Video ID: ${videoId}, Page: ${pageNumber}`);
            resolve();
          })
          .catch((error) => {
            console.error('Error saving highlights:', error);
            reject(error);
          });
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
}

export default StorageUtils;
