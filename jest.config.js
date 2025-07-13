module.exports = {
  // Enable code coverage collection
  collectCoverage: true,
  // Define coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // Load jest-extended matchers
  setupFilesAfterEnv: ['jest-extended']
};