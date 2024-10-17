// tests/setupJest.js

// Mocking chrome APIs
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
