// jest.config.cjs

// Handles the actual code transformation
// Converts syntax between module systems
// Works with Jest to transform your ES Module code

// note the .cjs file extension explicity declares this as CommonJS
const config = {
  // Tells Jest to use jsdom to simulate browser APIs (like document, window)
  // Necessary when testing code that uses browser APIs
  testEnvironment: 'jsdom',

  // This setting tells Jest to use babel-jest to transform your JavaScript files
  // The regex '^.+\.jsx?$' matches any .js or .jsx file
  // This tells Jest "use babel-jest to process these files".
  // Note so for .js file, this is full workflow
  // → Jest identifies as ES Module (extensionsToTreatAsEsm)
  // → Babel processes it (transform)
  // → Babel preserves ES Module syntax (modules: false)
  // → Jest runs the ES Module code
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // Helps Jest resolve ES Module imports that include .js extensions
  // In ES Modules, you must use './file.js', but in CommonJS './file' is fine
  // This mapper lets Jest handle both styles
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',  // Handles import paths with .js extensions
  },

  // By default, Jest doesn't transform node_modules
  // This pattern tells Jest to transform certain ES Module packages
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
  ],

  // Points to a setup file that runs before your tests
  // This file typically contains global mocks (like chrome.storage)
  setupFilesAfterEnv: ['<rootDir>/tests/setupJestMocks.js'],

  // Helps Jest resolve packages that use conditional exports
  // Example: A package might have different exports for different environments:
  // {
  //   "exports": {
  //     "import": "./index.mjs",     // Used for ES Modules (import/export)
  //     "require": "./index.cjs",    // Used for CommonJS (require/module.exports)
  //     "node": "./node.js",         // Used specifically in Node.js environment
  //     "default": "./fallback.js"   // Fallback if no condition matches
  //   }
  // }
  // This setting helps Jest choose the right export variant when running tests
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  
  // Specify file extensions Jest should look for when resolving modules
  // This list covers most common JavaScript-related extensions
  moduleFileExtensions: ['js', 'mjs', 'jsx', 'json'],

  // Configures different types of tests
  projects: [
    {
      // Configuration for unit tests
      displayName: 'unit',
      // Looks for .test.js files in the tests directory
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      // Excludes integration.test.js from unit tests
      testPathIgnorePatterns: ['<rootDir>/tests/integration.test.js'],
    },
    {
      // Configuration for integration tests with Puppeteer
      displayName: 'integration',
      preset: 'jest-puppeteer',
      testMatch: ['<rootDir>/tests/integration.test.js'],
      testEnvironment: 'jest-environment-puppeteer',
    },
  ]
};

module.exports = config;