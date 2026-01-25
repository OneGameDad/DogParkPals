module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup.ts'],
  maxWorkers: 1,
  testTimeout: 45000,
};
