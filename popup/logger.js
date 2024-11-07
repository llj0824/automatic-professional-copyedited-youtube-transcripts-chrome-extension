import EncryptionUtils from './encryption.js';
class Logger {
  // Class-level constants for event names
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

  // Class-level constants for data fields
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
    this.SHEET_ID = '1eIibhZkdkSaDPGOjvvXWl7x7Ar2TZd9pXgMv2Mt9jbU';
    this.CREDENTIALS = {
      type: "service_account",
      project_id: "professionalyoutubetranscript",
      private_key_id: EncryptionUtils.decryptString(EncryptionUtils.ENCRYPTED_GOOGLESHEETS_PRIVATE_KEY_ID),
      private_key: EncryptionUtils.decryptString(EncryptionUtils.ENCRYPTED_GOOGLESHEETS_PRIVATE_KEY),
      client_email: "googlesheetslogging@professionalyoutubetranscript.iam.gserviceaccount.com",
      client_id: "103624239886143270739",
    };
    this.token = null;
    this.tokenExpiry = null;
    // Add missing BASE_URL
    this.BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  async getToken() {
    if (this.token && this.tokenExpiry && (Date.now() < (this.tokenExpiry - 300000))) {
      return this.token;
    }

    const jwt = await EncryptionUtils.generateGoogleSheetsJWT(this.CREDENTIALS);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this.token;
  }

  async logEvent(eventName, data = {}) {
    const timestamp = new Date().toISOString();
    const row = [timestamp, eventName, JSON.stringify(data)];

    try {
      const token = await this.getToken();
      const url = `${this.BASE_URL}/${this.SHEET_ID}/values/Logging!A:C:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
      
      // Add logging
      console.log('Row data:', row);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: 'Logging!A:C',
          majorDimension: 'ROWS',
          values: [row]
        })
      });

      // Add response logging
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to log event: ${response.status} ${responseText}`);
      }

    } catch (error) {
      console.error('Logging error:', error);
      throw error; // Re-throw to make test fail with actual error
    }
  }

  logError(errorType, error) {
    this.logEvent('error', {
      type: errorType,
      message: error.message || error,
      stack: error.stack
    });

    console.error('Logging error:', error);
  }
};

export default Logger;