// jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // Use jsdom environment for browser-like features
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Setup files to run before test framework is installed
  // setupFilesAfterEnv: ['./jest.setup.js'], // Optional: for global mocks/setup

  // You might need transform rules if using features Jest doesn't understand natively
  // transform: {},
  
  // Module file extensions for importing
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],

  // Mock Chrome APIs
  setupFiles: ['<rootDir>/jest.setup.js']
};
