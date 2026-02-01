export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "mjs"],
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 30000, // 30 seconds for database operations
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  maxWorkers: 1 // Run tests serially to avoid database conflicts
};