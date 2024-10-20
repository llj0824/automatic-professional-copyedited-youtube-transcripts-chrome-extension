// tests/jest.setup.js
import { jest } from '@jest/globals';
import nodeFetch from 'node-fetch';
const { TextEncoder, TextDecoder } = require('util');

// Set up TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof window !== 'undefined') {
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
}

// Set up fetch
global.fetch = nodeFetch;

// Mock Chrome API
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