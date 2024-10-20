// jest.config.js

// Import and set up TextEncoder and TextDecoder globally
// This is necessary for certain tests that rely on these APIs
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

module.exports = {
  // Use jsdom as the test environment to simulate a browser-like environment
  testEnvironment: 'jsdom',

  // Use babel-jest to transform JavaScript/JSX files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // Ignore transformations for all node_modules except specific packages
  // This is necessary for packages that use ES modules (like node-fetch), bc jest uses commonJs not ES.
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
  ],

  // Set up file to run after the test environment is set up but before tests are run
  // This file likely contains global mocks and other test setup
  setupFilesAfterEnv: ['<rootDir>/tests/setupJestMocks.js'],

  // Specify custom export conditions for the test environment
  // This helps with resolving modules that use conditional exports
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  // Specify file extensions Jest should look for when resolving modules
  // This list covers most common JavaScript-related extensions
  moduleFileExtensions: ['js', 'mjs', 'jsx', 'json'],
};
