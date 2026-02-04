export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "mjs"],
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  maxWorkers: 1 
};