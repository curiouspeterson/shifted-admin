/**
 * Jest Configuration for Accessibility Testing
 * Last Updated: 2025-03-19
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/a11y/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/lib/(.*)$': '<rootDir>/app/lib/$1',
  },
  testMatch: [
    '<rootDir>/tests/a11y/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'app/components/**/*.{ts,tsx}',
    '!app/components/**/*.stories.{ts,tsx}',
    '!app/components/**/index.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Add more setup options before each test is run
  verbose: true,
  testTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 