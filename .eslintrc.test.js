/**
 * ESLint Test Configuration
 * Last Updated: 2025-03-19
 */
module.exports = {
  extends: ['./.eslintrc.js'],
  env: {
    jest: true,
    'jest/globals': true
  },
  plugins: ['jest'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/valid-expect': 'error'
  }
} 