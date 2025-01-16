/**
 * Background Sync Tests
 * Last Updated: 2024-01-15
 * 
 * Tests for the background sync service, covering various scenarios
 * like online/offline transitions, concurrent operations, and error recovery.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'
import { BackgroundSyncService } from '../background-sync-service'
import { LocalSyncStorage } from '../local-storage'
import { createMockSupabaseClient } from './mocks/supabase'
import { Database } from '@/lib/database/database.types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test data
const testSchedule = {
  name: 'Test Schedule',
  description: 'Test Description',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'DRAFT',
  isActive: true
}

describe('BackgroundSyncService', () => {
  let syncService: BackgroundSyncService
  let storage: LocalSyncStorage
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Create fresh instances
    storage = new LocalSyncStorage()
    mockSupabase = createMockSupabaseClient()
    syncService = new BackgroundSyncService(mockSupabase.client, storage)

    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Online Operations', () => {
    it('should process create operation immediately when online', async () => {
      // Setup mock
      mockSupabase.queryBuilder.mockReturnValue({ data: null, error: null })

      // Add operation
      await syncService.addOperation('create', 'schedules', testSchedule)

      // Verify
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(testSchedule)
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.completed).toBe(1)
      expect(stats.pending).toBe(0)
    })

    it('should process update operation immediately when online', async () => {
      // Setup mock
      mockSupabase.queryBuilder.mockReturnValue({ data: null, error: null })

      // Add operation
      await syncService.addOperation('update', 'schedules', { id: '123', ...testSchedule })

      // Verify
      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ id: '123', ...testSchedule })
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.completed).toBe(1)
      expect(stats.pending).toBe(0)
    })

    it('should handle database errors properly', async () => {
      // Setup mock
      mockSupabase.queryBuilder.mockReturnValue({
        data: null,
        error: { code: '23505', message: 'Unique violation' }
      })

      // Add operation
      await syncService.addOperation('create', 'schedules', testSchedule)

      // Check stats
      const stats = await syncService.getStats()
      expect(stats.failed).toBe(1)
      expect(stats.completed).toBe(0)
      expect(stats.lastError).toContain('Unique violation')
    })
  })

  describe('Offline Operations', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
    })

    it('should queue operations when offline', async () => {
      // Add operation
      await syncService.addOperation('create', 'schedules', testSchedule)

      // Verify no API calls
      expect(mockSupabase.client.from).not.toHaveBeenCalled()
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.pending).toBe(1)
      expect(stats.completed).toBe(0)
    })

    it('should process queued operations when coming online', async () => {
      // Setup mock
      mockSupabase.queryBuilder.mockReturnValue({ data: null, error: null })

      // Add operation while offline
      await syncService.addOperation('create', 'schedules', testSchedule)

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(testSchedule)
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.completed).toBe(1)
      expect(stats.pending).toBe(0)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple operations in order', async () => {
      // Setup mock
      mockSupabase.queryBuilder.mockReturnValue({ data: null, error: null })

      // Add multiple operations
      await Promise.all([
        syncService.addOperation('create', 'schedules', testSchedule),
        syncService.addOperation('update', 'schedules', { id: '123', ...testSchedule }),
        syncService.addOperation('delete', 'schedules', { id: '123' })
      ])

      // Verify operations were called
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(testSchedule)
      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ id: '123', ...testSchedule })
      expect(mockSupabase.queryBuilder.delete).toHaveBeenCalled()
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.completed).toBe(3)
      expect(stats.pending).toBe(0)
    })
  })

  describe('Error Recovery', () => {
    it('should retry failed operations', async () => {
      // Setup mock to fail once then succeed
      mockSupabase.queryBuilder
        .mockReturnValue({ data: null, error: { code: '40001', message: 'Deadlock' } })
        .mockReturnValue({ data: null, error: null })

      // Add operation
      await syncService.addOperation('create', 'schedules', testSchedule)

      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Verify retry
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledTimes(2)
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.completed).toBe(1)
      expect(stats.failed).toBe(0)
    })

    it('should stop retrying after max attempts', async () => {
      // Setup mock to always fail
      mockSupabase.queryBuilder.mockReturnValue({
        data: null,
        error: { code: '23505', message: 'Unique violation' }
      })

      // Add operation
      await syncService.addOperation('create', 'schedules', testSchedule)

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 3300))

      // Verify number of attempts
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledTimes(3)
      
      // Check stats
      const stats = await syncService.getStats()
      expect(stats.failed).toBe(1)
      expect(stats.completed).toBe(0)
    })
  })

  describe('Storage Limits', () => {
    it('should handle storage limits properly', async () => {
      // Create many operations
      const operations = Array.from({ length: 1100 }, (_, i) => ({
        ...testSchedule,
        name: `Schedule ${i}`
      }))

      // Add all operations
      await Promise.all(operations.map(data => 
        syncService.addOperation('create', 'schedules', data)
      ))

      // Check storage limit
      const stats = await syncService.getStats()
      expect(stats.pending + stats.completed + stats.failed).toBeLessThanOrEqual(1000)
    })
  })
}) 