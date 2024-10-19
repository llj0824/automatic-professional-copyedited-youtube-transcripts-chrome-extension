// jest.config.js

module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupJestMocks.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  extensionsToTreatAsEsm: ['.js'],
  moduleFileExtensions: ['js', 'mjs', 'jsx', 'json'],
};
