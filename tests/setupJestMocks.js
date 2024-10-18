// tests/setupJest.js
import fetch from 'node-fetch';

// Assign fetch to the global object
global.fetch = fetch;


global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      // Add other methods if needed
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      // Add other methods like remove, clear if used
    },
  },
  runtime: {
    // Add runtime mocks if necessary
  },
  // Mock other chrome APIs as required
};

// Mock window.alert
global.alert = jest.fn();