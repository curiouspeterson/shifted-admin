/**
 * Jest Setup File
 * Last Updated: 2024-01-15
 * 
 * This file extends Jest's functionality with additional matchers
 * and global test setup configuration, specifically for PWA testing.
 */

import '@testing-library/jest-dom'

// Mock service worker
Object.defineProperty(window.navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(undefined)
  }
})

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
}

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  }
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(name: string) {
    this.name = name
  }
  name: string
  postMessage = jest.fn()
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
  close = jest.fn()
}

// Setup global mocks
global.IntersectionObserver = MockIntersectionObserver as any
global.BroadcastChannel = MockBroadcastChannel as any
global.indexedDB = mockIndexedDB as any

// Add any global test setup here
beforeAll(() => {
  // Reset all mocks before each test suite
  jest.resetAllMocks()
})

afterAll(() => {
  // Cleanup mocks after all tests
  jest.restoreAllMocks()
}) 