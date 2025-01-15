/**
 * Jest Configuration
 * Last updated: January 15, 2024
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/lib/(.*)$': '<rootDir>/app/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/app/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/app/lib/utils/$1',
    '^@/types/(.*)$': '<rootDir>/app/lib/types/$1',
    '^@/schemas/(.*)$': '<rootDir>/app/lib/schemas/$1',
    '^@/styles/(.*)$': '<rootDir>/app/styles/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1'
  },
  testMatch: [
    '<rootDir>/app/**/*.test.{ts,tsx}',
    '<rootDir>/app/**/*.spec.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/*.stories.{ts,tsx}',
    '!app/**/_*.{ts,tsx}',
    '!app/**/page.tsx',
    '!app/**/layout.tsx',
    '!app/api/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ]
};

module.exports = createJestConfig(customJestConfig); 