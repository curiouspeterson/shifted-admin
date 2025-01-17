/**
 * useOfflineData Hook
 * Last Updated: 2024-03-21
 * 
 * Unified hook for offline data management with automatic syncing,
 * optimistic updates, and user feedback.
 */

'use client'

import { useEffect, useReducer, useCallback } from 'react'
import { toast, toastMessages } from '@/lib/utils/toast'
import { indexedDB } from '@/lib/storage/indexed-db'
import { errorLogger } from '@/lib/logging/error-logger'
import { formatError } from '@/lib/utils/errors/error'
import { DatabaseError } from '@/lib/errors/base'

// Status represents the current state of the data
type Status = 'idle' | 'loading' | 'syncing' | 'error'

interface OfflineData<T> {
  data: T | null
  status: Status
  error: DatabaseError | null
  lastSynced: number | null
  isStale: boolean
}

interface UseOfflineDataReturn<T> extends OfflineData<T> {
  isLoading: boolean
  isSyncing: boolean
  saveData: (data: T) => Promise<void>
  syncData: () => Promise<void>
}

type Action<T> =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: T | null }
  | { type: 'LOAD_ERROR'; payload: DatabaseError }
  | { type: 'SYNC_START' }
  | { type: 'SYNC_SUCCESS'; payload: T; timestamp: number }
  | { type: 'SYNC_ERROR'; payload: DatabaseError }
  | { type: 'UPDATE_OPTIMISTIC'; payload: T }
  | { type: 'MARK_STALE' }

function reducer<T>(state: OfflineData<T>, action: Action<T>): OfflineData<T> {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        status: 'loading',
        error: null
      }
    case 'LOAD_SUCCESS':
      return {
        ...state,
        data: action.payload,
        status: 'idle',
        error: null
      }
    case 'LOAD_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload
      }
    case 'SYNC_START':
      return {
        ...state,
        status: 'syncing'
      }
    case 'SYNC_SUCCESS':
      return {
        ...state,
        data: action.payload,
        status: 'idle',
        lastSynced: action.timestamp,
        isStale: false
      }
    case 'SYNC_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        isStale: true
      }
    case 'UPDATE_OPTIMISTIC':
      return {
        ...state,
        data: action.payload,
        isStale: true
      }
    case 'MARK_STALE':
      return {
        ...state,
        isStale: true
      }
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
  onSyncError?: (error: DatabaseError) => void
}

export function useOfflineData<T>({
  store,
  id,
  fetcher,
  syncInterval = 30000,
  onSyncComplete,
  onSyncError
}: UseOfflineDataOptions<T>): UseOfflineDataReturn<T> {
  const initialState: OfflineData<T> = {
    data: null,
    status: 'idle',
    error: null,
    lastSynced: null,
    isStale: false
  }

  const [state, dispatch] = useReducer(reducer<T>, initialState)

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      dispatch({ type: 'LOAD_START' })
      const item = await indexedDB.get<T>(store, id)
      
      if (item) {
        dispatch({ type: 'LOAD_SUCCESS', payload: item.data })
        if (!item.synced) {
          dispatch({ type: 'MARK_STALE' })
        }
      } else {
        dispatch({ type: 'LOAD_SUCCESS', payload: null })
      }
    } catch (error) {
      const dbError = error instanceof DatabaseError 
        ? error 
        : new DatabaseError('Failed to load offline data', { cause: error })
      
      errorLogger.error(dbError.message, {
        error: formatError(dbError),
        store,
        id
      })
      
      dispatch({ type: 'LOAD_ERROR', payload: dbError })
      const { title, description, type } = toastMessages.offline
      toast[type](title, { description })
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
      
      const { title, description, type } = toastMessages.saveSuccess
      toast[type](title, { description })
      
      // Trigger sync if fetcher provided
      if (fetcher) {
        void syncData()
      }
    } catch (error) {
      const dbError = error instanceof DatabaseError
        ? error
        : new DatabaseError('Failed to save offline data', { cause: error })
      
      errorLogger.error(dbError.message, {
        error: formatError(dbError),
        store,
        id
      })
      
      const { title, description, type } = toastMessages.saveError
      toast[type](title, { description })
      
      // Reload data to ensure consistency
      void loadData()
    }
  }, [store, id, fetcher, loadData])

  // Sync data with server
  const syncData = useCallback(async () => {
    if (!fetcher) return
    
    try {
      dispatch({ type: 'SYNC_START' })
      
      const item = await indexedDB.get<T>(store, id)
      if (!item || item.synced) {
        const timestamp = Date.now()
        const freshData = await fetcher()
        dispatch({ type: 'SYNC_SUCCESS', payload: freshData, timestamp })
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

      const timestamp = Date.now()
      dispatch({ type: 'SYNC_SUCCESS', payload: freshData, timestamp })
      onSyncComplete?.()
      
      const { title, description, type } = toastMessages.syncSuccess
      toast[type](title, { description })
    } catch (error) {
      const dbError = error instanceof DatabaseError
        ? error
        : new DatabaseError('Failed to sync offline data', { cause: error })
      
      errorLogger.error(dbError.message, {
        error: formatError(dbError),
        store,
        id
      })
      
      dispatch({ type: 'SYNC_ERROR', payload: dbError })
      onSyncError?.(dbError)
      
      const { title, description, type } = toastMessages.syncError
      toast[type](title, { description })
    }
  }, [store, id, fetcher, onSyncComplete, onSyncError])

  // Initial load
  useEffect(() => {
    void loadData()
  }, [loadData])

  // Periodic sync
  useEffect(() => {
    if (!syncInterval || !fetcher) return

    const interval = setInterval(() => void syncData(), syncInterval)
    return () => clearInterval(interval)
  }, [syncData, syncInterval, fetcher])

  // Listen for sync messages from service worker
  useEffect(() => {
    const channel = new BroadcastChannel('sync-updates')
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        void loadData()
      }
    }
    
    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [loadData])

  return {
    ...state,
    isLoading: state.status === 'loading',
    isSyncing: state.status === 'syncing',
    saveData,
    syncData
  }
} 