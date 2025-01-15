/**
 * Jest Setup
 * Last Updated: 2024-01-15
 */

import '@testing-library/jest-dom'

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(channel) {
    this.channel = channel
    this.onmessage = null
  }

  postMessage(message) {
    // Simulate async message dispatch
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: message })
      }
    }, 0)
  }

  close() {}
}

global.BroadcastChannel = MockBroadcastChannel

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
}

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }

  disconnect() {
    return null
  }
}

global.IntersectionObserver = MockIntersectionObserver 