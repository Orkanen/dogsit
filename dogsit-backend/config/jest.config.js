export default {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'json-summary'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    passWithNoTests: true
};
  