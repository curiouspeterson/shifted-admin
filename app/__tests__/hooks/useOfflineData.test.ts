/**
 * useOfflineData Hook Tests
 * Last Updated: 2024-01-15
 */

import { renderHook, act } from '@testing-library/react'
import { useOfflineData } from '@/hooks/useOfflineData'
import { indexedDB } from '@/lib/storage/indexed-db'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock IndexedDB
jest.mock('@/lib/storage/indexed-db')

describe('useOfflineData', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useOfflineData({
      store: 'test-store',
      id: 'test-id'
    }))

    expect(result.current).toEqual({
      data: null,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: null,
      saveData: expect.any(Function),
      syncData: expect.any(Function),
      refresh: expect.any(Function)
    })
  })

  it('should load data from IndexedDB', async () => {
    const mockData = { name: 'Test' }
    const mockStorageItem = {
      id: 'test-id',
      data: mockData,
      timestamp: Date.now(),
      synced: true
    }
    jest.mocked(indexedDB.get).mockResolvedValueOnce(mockStorageItem)

    const { result } = renderHook(() => useOfflineData({
      store: 'test-store',
      id: 'test-id'
    }))

    await act(async () => {
      // Wait for state updates
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle errors', async () => {
    const error = new Error('Failed to load')
    jest.mocked(indexedDB.get).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useOfflineData({
      store: 'test-store',
      id: 'test-id'
    }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isLoading).toBe(false)
  })

  it('should save data to IndexedDB', async () => {
    const mockData = { name: 'Test' }
    jest.mocked(indexedDB.set).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useOfflineData({
      store: 'test-store',
      id: 'test-id'
    }))

    await act(async () => {
      await result.current.saveData(mockData)
    })

    expect(jest.mocked(indexedDB.set)).toHaveBeenCalledWith(
      'test-store',
      expect.objectContaining({
        id: 'test-id',
        data: mockData,
        synced: false
      })
    )
  })
}) 