// config/jest.config.js
const path = require('path');

const rootDir = path.join(__dirname, '..'); // dogsit-backend/

module.exports = {
  rootDir,  // Tell Jest the project root
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: path.join(rootDir, 'config', 'coverage'),
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],

  testMatch: [
    '<rootDir>/__tests__/*.test.js',
    '<rootDir>/__tests__/**/*.test.js'
  ],

  collectCoverageFrom: [
    '<rootDir>/**/*.js',
    '!<rootDir>/**/*.test.js',
    '!<rootDir>/node_modules/**',
    '!<rootDir>/coverage/**',
    '!<rootDir>/config/**',
    '!<rootDir>/scripts/**'
  ],

  passWithNoTests: true
};