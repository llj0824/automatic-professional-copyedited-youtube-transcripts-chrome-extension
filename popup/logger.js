class Logger {
  static EVENTS = {
    EXTENSION_OPENED: 'extension_opened',
    TRANSCRIPT_RETRIEVAL_ATTEMPT: 'transcript_retrieval_attempt',
    TRANSCRIPT_FOUND_IN_STORAGE: 'transcript_found_in_storage',
    TRANSCRIPT_RETRIEVED_FROM_YOUTUBE: 'transcript_retrieved_from_youtube',
    PROCESS_TRANSCRIPT_ATTEMPT: 'process_transcript_attempt',
    PROCESS_TRANSCRIPT_SUCCESS: 'process_transcript_success',
    ERROR: 'error',
    PAGE_NAVIGATION: 'page_navigation',
    TAB_SWITCH: 'tab_switch',
    FONT_SIZE_CHANGE: 'font_size_change',
    COPY_ATTEMPT: 'copy_attempt',
    COPY_SUCCESS: 'copy_success',
    MANUAL_TRANSCRIPT_LOAD: 'manual_transcript_load',
    PROCESS_TRANSCRIPT_START: 'process_transcript_start',
    PROCESS_TRANSCRIPT_FAILURE: 'process_transcript_failure'
  };

  static FIELDS = {
    VIDEO_ID: 'videoId',
    TRANSCRIPT_LENGTH: 'transcriptLength',
    MODEL: 'model',
    PAGE_INDEX: 'pageIndex',
    ERROR: 'error',
    ERROR_TYPE: 'errorType',
    ERROR_MESSAGE: 'errorMessage',
    ERROR_STACK: 'errorStack',
    RESPONSE_LENGTH: 'responseLength',
    TIMESTAMP: 'timestamp',
    NAVIGATION_DIRECTION: 'navigationDirection',
    TAB_NAME: 'tabName',
    FONT_SIZE: 'fontSize',
    COPY_TARGET: 'copyTarget',
    PROCESSING_TIME: 'processingTime',
    SUCCESS: 'success'
  };

  constructor() {
    // Set the URL of your deployed Google Apps Script web app
    this.loggingEndpoint = 'https://script.google.com/macros/s/AKfycbwMzBx3xT-pIK-xi_fxGD5ZOZNwAbpyoQ7gSJ8pzirXmEpERc6OWqP0RWeSIiDa75EuEA/exec';


  }

  async logEvent(eventName, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event: eventName,
      data
    };

    try {
      const response = await fetch(this.loggingEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });

    } catch (error) {
      console.error('Logging error:', error);
      await this._storeLogLocally(logEntry);
    }
  }

  async _storeLogLocally(logEntry) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['failed_logs'], (result) => {
        const failedLogs = result.failed_logs || [];
        failedLogs.push(logEntry);

        // Keep only the last 1000 failed logs
        if (failedLogs.length > 1000) {
          failedLogs.shift();
        }

        chrome.storage.local.set({ failed_logs: failedLogs }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async retryFailedLogs() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['failed_logs'], async (result) => {
        const failedLogs = result.failed_logs || [];
        const successfulRetries = [];

        for (const logEntry of failedLogs) {
          try {
            await fetch(this.loggingEndpoint, {
              method: 'POST',
              mode: 'no-cors',
              credentials: 'omit',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(logEntry)
            });

            successfulRetries.push(logEntry);
          } catch (error) {
            console.error('Failed to retry log:', error);
          }
        }

        // Remove successful retries from failed logs
        const remainingLogs = failedLogs.filter(log => !successfulRetries.includes(log));

        chrome.storage.local.set({ failed_logs: remainingLogs }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(successfulRetries.length);
          }
        });
      });
    });
  }
}

export default Logger;