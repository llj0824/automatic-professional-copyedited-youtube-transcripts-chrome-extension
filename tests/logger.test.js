import Logger from '../popup/logger.js';
import EncryptionUtils from '../popup/encryption.js';

describe('Logger Functional Tests', () => {
  const logger = new Logger();
  let testRows = [];

  // Cleanup test data after tests
  afterAll(async () => {
    if (testRows.length > 0) {
      try {
        // Delete test rows (implementation depends on your Sheets API setup)
        console.log('Cleanup: Test rows would be deleted here');
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }
  });

  describe('Google Sheets Integration', () => {
    it('should verify Google Sheets access', async () => {
      const token = await logger.getToken();
      const testUrl = `${logger.BASE_URL}/${logger.SHEET_ID}?fields=properties.title`;

      console.log('Testing sheet access...');
      console.log('URL:', testUrl);

      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const data = await response.text();
      console.log('Response:', data);

      expect(response.status).toBe(200);
    });

    it('should successfully log an event to Google Sheets', async () => {
      // Write the log event to google sheets
      const testEvent = {
        eventName: 'test_event',
        data: {
          test_field: 'test_value',
          timestamp: new Date().toISOString(),
          test_id: Math.random().toString(36).substring(7) // Add unique identifier
        }
      };
      console.log('Sending test event:', testEvent);
      await logger.logEvent(testEvent.eventName, testEvent.data);

      // Read and confirm the event was sent.
      const token = await logger.getToken();
      const url = `${logger.BASE_URL}/${logger.SHEET_ID}/values/Logging!A:C?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;

      // Add logging for the request
      console.log('Fetching from URL:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Add logging for the response
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      // Convert text back to JSON for the test
      const data = JSON.parse(responseText);

      expect(response.status).toBe(200);
      const lastRow = data.values[data.values.length - 1];

      expect(lastRow).toHaveLength(3);
      expect(lastRow[1]).toBe(testEvent.eventName);
      const parsedData = JSON.parse(lastRow[2]);
      expect(parsedData).toMatchObject(testEvent.data);

      testRows.push(lastRow); // Track for cleanup
    }, 15000);

    it('should handle logging errors correctly', async () => {
      const testError = new Error('Test error message');
      const errorType = 'TEST_ERROR';
      const uniqueId = Math.random().toString(36).substring(7);
      testError.uniqueId = uniqueId; // Add unique identifier

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      await logger.logError(errorType, testError);

      const token = await logger.getToken();
      const response = await fetch(
        `${logger.BASE_URL}/${logger.SHEET_ID}/values/Logging!A:C?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      const lastRow = data.values[data.values.length - 1];
      const loggedData = JSON.parse(lastRow[2]);

      expect(lastRow[1]).toBe('error');
      expect(loggedData.type).toBe(errorType);
      expect(loggedData.message).toBe(testError.message);
      expect(loggedData.stack).toBeTruthy();
      expect(loggedData.stack).toContain('Error: Test error message');

      consoleErrorSpy.mockRestore();
      testRows.push(lastRow); // Track for cleanup
    }, 15000);
  });

  describe('Token Management', () => {
    it('should reuse existing token if not expired', async () => {
      const token1 = await logger.getToken();
      const expiry1 = logger.tokenExpiry;

      // Small delay to ensure timestamps are different if token is refreshed
      await new Promise(resolve => setTimeout(resolve, 100));

      const token2 = await logger.getToken();
      const expiry2 = logger.tokenExpiry;

      expect(token2).toBe(token1);
      expect(expiry2).toBe(expiry1);
    });

    it('should get new token if current one is expired', async () => {
      const token1 = await logger.getToken();

      logger.tokenExpiry = Date.now() - 1000; // Expire token

      const token2 = await logger.getToken();

      expect(token2).not.toBe(token1);
      expect(logger.tokenExpiry).toBeGreaterThan(Date.now());
    });

    it('should handle token refresh errors gracefully', async () => {
      logger.token = 'invalid_token';
      logger.tokenExpiry = Date.now() - 1000;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      try {
        await logger.logEvent('test_event', { data: 'test' });
      } catch (error) {
        expect(error).toBeTruthy();
      }

      consoleErrorSpy.mockRestore();
    });
  });
});