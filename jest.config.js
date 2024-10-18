// jest.config.js

export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!node-fetch)',
    '/node_modules/(?!data-uri-to-buffer)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupJestMocks.js'],
};
