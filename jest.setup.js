/**
 * Jest Setup
 * Last Updated: 2024-03-19 17:50 PST
 */

// Mock console methods to prevent noise in test output
global.console = {
  ...console,
  // Keep error logging for debugging
  error: jest.fn(),
  // Silence info and debug logs during tests
  info: jest.fn(),
  debug: jest.fn(),
  // Keep warnings but make them less noisy
  warn: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  // Add custom matchers here
}); 