// tests/setupJest.js



import { domMockSetup } from './domMockSetup';
domMockSetup();


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
