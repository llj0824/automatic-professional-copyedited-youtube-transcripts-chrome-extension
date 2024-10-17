// tests/setupJest.js

// Mocks the chrome API
global.chrome = {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        // Add other methods if needed
      },
    },
    runtime: {
      // Add runtime mocks if necessary
    },
    // Mock other chrome APIs as required
  };