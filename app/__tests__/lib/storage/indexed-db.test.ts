/**
 * IndexedDB Tests
 * Last Updated: 2024-01-15
 */

import { indexedDB } from '@/lib/storage/indexed-db'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock IDB
const mockIDB = {
  openDB: jest.fn(),
  deleteDB: jest.fn(),
  unwrap: jest.fn(),
  wrap: jest.fn()
}

jest.mock('idb', () => mockIDB)

describe('indexedDB', () => {
  const TEST_STORE = 'test-store'
  const TEST_ID = 'test-id'
  const TEST_DATA = { name: 'Test' }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('should retrieve data from store', async () => {
      const mockItem = {
        id: TEST_ID,
        data: TEST_DATA,
        timestamp: Date.now(),
        synced: true
      }

      mockIDB.openDB.mockResolvedValueOnce({
        get: jest.fn().mockResolvedValueOnce(mockItem),
        transaction: jest.fn()
      })

      const result = await indexedDB.get(TEST_STORE, TEST_ID)
      expect(result).toEqual(mockItem)
    })

    it('should handle missing data', async () => {
      mockIDB.openDB.mockResolvedValueOnce({
        get: jest.fn().mockResolvedValueOnce(null),
        transaction: jest.fn()
      })

      const result = await indexedDB.get(TEST_STORE, TEST_ID)
      expect(result).toBeNull()
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to open database')
      mockIDB.openDB.mockRejectedValueOnce(error)

      await expect(indexedDB.get(TEST_STORE, TEST_ID)).rejects.toThrow()
    })
  })

  describe('set', () => {
    it('should store data', async () => {
      const mockPut = jest.fn().mockResolvedValueOnce(undefined)
      mockIDB.openDB.mockResolvedValueOnce({
        put: mockPut,
        transaction: jest.fn()
      })

      const item = {
        id: TEST_ID,
        data: TEST_DATA,
        timestamp: Date.now(),
        synced: false
      }

      await indexedDB.set(TEST_STORE, item)
      expect(mockPut).toHaveBeenCalledWith(TEST_STORE, item)
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to store data')
      mockIDB.openDB.mockResolvedValueOnce({
        put: jest.fn().mockRejectedValueOnce(error),
        transaction: jest.fn()
      })

      const item = {
        id: TEST_ID,
        data: TEST_DATA,
        timestamp: Date.now(),
        synced: false
      }

      await expect(indexedDB.set(TEST_STORE, item)).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('should delete data', async () => {
      const mockDelete = jest.fn().mockResolvedValueOnce(undefined)
      mockIDB.openDB.mockResolvedValueOnce({
        delete: mockDelete,
        transaction: jest.fn()
      })

      await indexedDB.delete(TEST_STORE, TEST_ID)
      expect(mockDelete).toHaveBeenCalledWith(TEST_STORE, TEST_ID)
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to delete data')
      mockIDB.openDB.mockResolvedValueOnce({
        delete: jest.fn().mockRejectedValueOnce(error),
        transaction: jest.fn()
      })

      await expect(indexedDB.delete(TEST_STORE, TEST_ID)).rejects.toThrow()
    })
  })

  describe('clear', () => {
    it('should clear store', async () => {
      const mockClear = jest.fn().mockResolvedValueOnce(undefined)
      mockIDB.openDB.mockResolvedValueOnce({
        clear: mockClear,
        transaction: jest.fn()
      })

      await indexedDB.clear(TEST_STORE)
      expect(mockClear).toHaveBeenCalledWith(TEST_STORE)
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to clear store')
      mockIDB.openDB.mockResolvedValueOnce({
        clear: jest.fn().mockRejectedValueOnce(error),
        transaction: jest.fn()
      })

      await expect(indexedDB.clear(TEST_STORE)).rejects.toThrow()
    })
  })
}) 