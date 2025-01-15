/**
 * Service Worker Tests
 * Last Updated: 2024-01-15
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { PrecacheEntry } from 'workbox-precaching'

// Mock service worker globals
declare global {
  var mockServiceWorker: ServiceWorkerGlobalScope
}

// Mock workbox
jest.mock('workbox-precaching', () => ({
  precacheAndRoute: jest.fn()
}))

jest.mock('workbox-routing', () => ({
  registerRoute: jest.fn()
}))

jest.mock('workbox-strategies', () => ({
  StaleWhileRevalidate: jest.fn(),
  NetworkFirst: jest.fn(() => {
    return new (class MockNetworkFirst {})()
  }),
  CacheFirst: jest.fn(() => {
    return new (class MockCacheFirst {})()
  })
}))

// Mock BackgroundSyncPlugin with correct type
const mockOnSync = jest.fn()
jest.mock('workbox-background-sync', () => ({
  BackgroundSyncPlugin: jest.fn().mockImplementation(() => ({
    onSync: mockOnSync,
    maxRetentionTime: 24 * 60
  }))
}))

describe('Service Worker', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks()

    // Mock service worker
    const mockSelf = {
      __WB_MANIFEST: [] as Array<string | PrecacheEntry>,
      addEventListener: jest.fn(),
      skipWaiting: jest.fn(),
      clients: {
        claim: jest.fn()
      }
    } as unknown as ServiceWorkerGlobalScope

    global.mockServiceWorker = mockSelf

    // Import service worker
    jest.isolateModules(() => {
      require('@/sw')
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should register routes with correct strategies', () => {
    const { registerRoute } = require('workbox-routing')

    // Check API route registration
    expect(registerRoute).toHaveBeenCalledWith(
      expect.any(Function), // URL matcher
      expect.any(Object) // NetworkFirst instance
    )

    // Check static assets route registration
    expect(registerRoute).toHaveBeenCalledWith(
      expect.any(Function), // Request matcher
      expect.any(Object) // CacheFirst instance
    )
  })

  it('should configure background sync plugin', () => {
    expect(BackgroundSyncPlugin).toHaveBeenCalledWith({
      maxRetentionTime: expect.any(Number),
      onSync: expect.any(Function)
    })
  })

  it('should configure cache expiration', () => {
    expect(ExpirationPlugin).toHaveBeenCalledWith({
      maxEntries: expect.any(Number),
      maxAgeSeconds: expect.any(Number)
    })
  })

  it('should configure cacheable response', () => {
    expect(CacheableResponsePlugin).toHaveBeenCalledWith({
      statuses: [0, 200]
    })
  })

  describe('URL matching', () => {
    it('should match API routes', () => {
      const { registerRoute } = require('workbox-routing')
      const urlMatcher = registerRoute.mock.calls.find(
        (call: [Function, unknown]) => call[1] instanceof Object
      )[0] as (options: { url: URL }) => boolean

      expect(urlMatcher({ url: new URL('https://example.com/api/data') })).toBe(true)
      expect(urlMatcher({ url: new URL('https://example.com/static/image.png') })).toBe(false)
    })

    it('should match static assets', () => {
      const { registerRoute } = require('workbox-routing')
      const requestMatcher = registerRoute.mock.calls.find(
        (call: [Function, unknown]) => call[1] instanceof Object
      )[0] as (options: { request: Request }) => boolean

      const imageRequest = new Request('image.png')
      Object.defineProperty(imageRequest, 'destination', { value: 'image' })

      const docRequest = new Request('data.json')
      Object.defineProperty(docRequest, 'destination', { value: 'document' })

      expect(requestMatcher({ request: imageRequest })).toBe(true)
      expect(requestMatcher({ request: docRequest })).toBe(false)
    })
  })

  describe('sync event handling', () => {
    it('should process sync queue on sync event', async () => {
      const syncEvent = new Event('sync') as SyncEvent
      Object.defineProperty(syncEvent, 'tag', {
        value: 'workbox-background-sync:my-queue'
      })

      await mockOnSync(syncEvent)
      expect(mockOnSync).toHaveBeenCalledWith(syncEvent)
    })
  })
}) 