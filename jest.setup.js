// jest.setup.js
// Mock the chrome API globally

global.chrome = {
  runtime: {
    lastError: null, // Mock lastError property
    // Mock other runtime properties/methods if needed
  },
  downloads: {
    download: jest.fn((options, callback) => {
      // Simulate successful download start
      const downloadId = Math.floor(Math.random() * 1000);
      console.log(`Mock chrome.downloads.download called with:`, options, `Assigned ID: ${downloadId}`);
      // Simulate async callback
      setTimeout(() => {
          // Check if we should simulate an error based on URL or filename for testing
          if (options.url === 'fail_download_url') {
              global.chrome.runtime.lastError = { message: 'Simulated download failure.' };
              callback(undefined); // No downloadId on error
              global.chrome.runtime.lastError = null; // Reset for next test
          } else {
              callback(downloadId);
          }
      }, 0);
    }),
    // Mock other downloads methods if needed
  },
  // Mock other chrome namespaces like storage, tabs if needed for other tests
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
    sync: {
        get: jest.fn(),
        set: jest.fn(),
    }
  },
  tabs: {
    query: jest.fn(),
    // Add other tab methods if needed
  }
};

// Polyfill fetch if running in Node environment without it
// require('whatwg-fetch'); // Usually provided by jsdom environment, but uncomment if needed

global.fetch = require('jest-fetch-mock');
global.fetchMock = global.fetch;
