module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
    '/src/tests/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/integration/',
  ],
  testTimeout: 30000,
};
