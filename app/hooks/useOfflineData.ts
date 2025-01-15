/**
 * useOfflineData Hook
 * Last Updated: 2024-03-20
 * 
 * Unified hook for offline data management with automatic syncing,
 * optimistic updates, and user feedback.
 */

'use client'

import { useEffect, useReducer, useCallback } from 'react'
import { toast, toastMessages } from '@/lib/utils/toast'
import { indexedDB } from '@/lib/storage/indexed-db'
import { errorLogger } from '@/lib/logging/error-logger'
import { formatError, createError } from '@/lib/utils/error'

interface OfflineData<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  isSyncing: boolean
  lastSynced: number | null
}

type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS'; payload: number }
  | { type: 'SYNC_ERROR'; payload: Error }
  | { type: 'UPDATE_OPTIMISTIC'; payload: T }

function reducer<T>(state: OfflineData<T>, action: Action<T>): OfflineData<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null }
    case 'FETCH_SUCCESS':
      return { ...state, data: action.payload, isLoading: false, error: null }
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload }
    case 'SYNC_START':
      return { ...state, isSyncing: true }
    case 'SYNC_SUCCESS':
      return { ...state, isSyncing: false, lastSynced: action.payload }
    case 'SYNC_ERROR':
      return { ...state, isSyncing: false, error: action.payload }
    case 'UPDATE_OPTIMISTIC':
      return { ...state, data: action.payload }
    default:
      return state
  }
}

interface UseOfflineDataOptions<T> {
  store: string
  id: string
  fetcher?: () => Promise<T>
  syncInterval?: number
  onSyncComplete?: () => void
  onSyncError?: (error: Error) => void
}

export function useOfflineData<T>({
  store,
  id,
  fetcher,
  syncInterval = 30000,
  onSyncComplete,
  onSyncError
}: UseOfflineDataOptions<T>) {
  const initialState: OfflineData<T> = {
    data: null,
    isLoading: false,
    error: null,
    isSyncing: false,
    lastSynced: null
  }

  const [state, dispatch] = useReducer(reducer<T>, initialState)

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      dispatch({ type: 'FETCH_START' })
      const item = await indexedDB.get<T>(store, id)
      
      if (item) {
        dispatch({ type: 'FETCH_SUCCESS', payload: item.data })
        
        // Show toast if data is from cache
        toast(toastMessages.saveSuccess)
      } else {
        dispatch({ type: 'FETCH_SUCCESS', payload: null as T })
      }
    } catch (error) {
      errorLogger.error('Failed to load offline data', {
        error: formatError(error),
        store,
        id
      })
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: error instanceof Error ? error : new Error('Failed to load data')
      })
      
      toast(toastMessages.offline)
    }
  }, [store, id])

  // Save data to IndexedDB
  const saveData = useCallback(async (data: T) => {
    try {
      dispatch({ type: 'UPDATE_OPTIMISTIC', payload: data })
      
      await indexedDB.set(store, {
        id,
        data,
        timestamp: Date.now(),
        synced: false
      })
      
      toast(toastMessages.saveSuccess)
      
      // Trigger sync if fetcher provided
      if (fetcher) {
        syncData()
      }
    } catch (error) {
      errorLogger.error('Failed to save offline data', {
        error: error instanceof Error ? error : new Error(String(error)),
        store,
        id
      })
      
      toast(toastMessages.saveError)
      
      // Reload data to revert optimistic update
      loadData()
    }
  }, [store, id, fetcher, loadData])

  // Sync data with server
  const syncData = useCallback(async () => {
    if (!fetcher) return
    
    try {
      dispatch({ type: 'SYNC_START' })
      
      const item = await indexedDB.get<T>(store, id)
      if (!item || item.synced) {
        dispatch({ type: 'SYNC_SUCCESS', payload: Date.now() })
        return
      }

      // Fetch fresh data
      const freshData = await fetcher()
      
      // Update storage with synced data
      await indexedDB.set(store, {
        ...item,
        data: freshData,
        synced: true,
        timestamp: Date.now()
      })

      dispatch({ type: 'SYNC_SUCCESS', payload: Date.now() })
      onSyncComplete?.()
      
      toast(toastMessages.syncSuccess)
    } catch (error) {
      errorLogger.error('Failed to sync offline data', {
        error: error instanceof Error ? error : new Error(String(error)),
        store,
        id
      })
      
      dispatch({ 
        type: 'SYNC_ERROR',
        payload: error instanceof Error ? error : new Error('Failed to sync data')
      })
      
      onSyncError?.(error instanceof Error ? error : new Error('Failed to sync data'))
      
      toast(toastMessages.syncError)
    }
  }, [store, id, fetcher, onSyncComplete, onSyncError])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Periodic sync
  useEffect(() => {
    if (!syncInterval || !fetcher) return

    const interval = setInterval(syncData, syncInterval)
    return () => clearInterval(interval)
  }, [syncData, syncInterval, fetcher])

  // Listen for sync messages from service worker
  useEffect(() => {
    const channel = new BroadcastChannel('sync-updates')
    
    channel.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        loadData()
      }
    })

    return () => channel.close()
  }, [loadData])

  return {
    ...state,
    saveData,
    syncData,
    refresh: loadData
  }
} 