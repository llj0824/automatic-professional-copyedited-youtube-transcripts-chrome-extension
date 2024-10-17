// jest.config.js

module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFiles: ['<rootDir>/tests/setupJestMocks.js'],
};
