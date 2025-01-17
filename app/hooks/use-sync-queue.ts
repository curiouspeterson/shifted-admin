/**
 * Sync Queue Hook
 * Last Updated: 2024-03-21
 * 
 * This hook manages a queue of offline changes that need to be
 * synchronized with the server when connectivity is restored.
 */

import { useState, useEffect, useCallback } from 'react'
import { errorLogger } from '@/lib/logging/error-logger'
import { indexedDB } from '@/lib/storage/indexed-db'

interface SyncOperation<T> {
  id: string
  operation: 'create' | 'update' | 'delete'
  timestamp: number
  data: T
  retryCount: number
  version: number
  status: 'pending' | 'processing' | 'failed'
}

interface SyncQueueOptions {
  maxRetries?: number
  retryDelay?: number
  conflictResolution?: 'client-wins' | 'server-wins' | 'manual'
}

/**
 * Format error for logging
 */
function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

export function useSyncQueue<T>(
  key: string,
  syncFn: (op: SyncOperation<T>) => Promise<void>,
  options: SyncQueueOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    conflictResolution = 'server-wins'
  } = options

  const [queue, setQueue] = useState<SyncOperation<T>[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Add operation to queue
  const enqueue = useCallback(async (
    operation: 'create' | 'update' | 'delete',
    data: T
  ) => {
    const syncOp: SyncOperation<T> = {
      id: crypto.randomUUID(),
      operation,
      timestamp: Date.now(),
      data,
      retryCount: 0,
      version: Date.now(),
      status: 'pending'
    }

    // Store in IndexedDB
    await indexedDB.set('syncQueue', {
      id: syncOp.id,
      data: syncOp,
      timestamp: Date.now(),
      synced: false
    })
    setQueue(prev => [...prev, syncOp])
    
    // Start sync if online
    if (isOnline) {
      processQueue()
    }
  }, [isOnline])

  // Process queue
  const processQueue = useCallback(async () => {
    if (isSyncing || queue.length === 0) return

    setIsSyncing(true)
    const currentOp = queue[0]

    try {
      await syncFn(currentOp)
      
      // Remove from queue on success
      await indexedDB.delete('syncQueue', currentOp.id)
      setQueue(prev => prev.slice(1))
    } catch (err) {
      errorLogger.error('Sync operation failed', {
        error: formatError(err),
        operation: currentOp
      })

      if (currentOp.retryCount < maxRetries) {
        // Update retry count and delay next attempt
        const updatedOp = {
          ...currentOp,
          retryCount: currentOp.retryCount + 1,
          status: 'failed' as const
        }
        await indexedDB.set('syncQueue', {
          id: updatedOp.id,
          data: updatedOp,
          timestamp: Date.now(),
          synced: false
        })
        setQueue(prev => [updatedOp, ...prev.slice(1)])
        
        setTimeout(processQueue, retryDelay)
      } else {
        // Move to end of queue after max retries
        const failedOp = {
          ...currentOp,
          status: 'failed' as const
        }
        await indexedDB.set('syncQueue', {
          id: failedOp.id,
          data: failedOp,
          timestamp: Date.now(),
          synced: false
        })
        setQueue(prev => [...prev.slice(1), failedOp])
      }
    } finally {
      setIsSyncing(false)
    }
  }, [queue, isSyncing, syncFn, maxRetries, retryDelay])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [processQueue])

  // Load queue from IndexedDB on mount
  useEffect(() => {
    async function loadQueue() {
      try {
        const item = await indexedDB.get<SyncOperation<T>[]>('syncQueue', key)
        if (item) {
          setQueue(item.data)
        }
      } catch (err) {
        errorLogger.error('Failed to load sync queue', {
          error: formatError(err)
        })
      }
    }

    loadQueue()
  }, [key])

  return {
    enqueue,
    queue,
    isSyncing,
    isOnline,
    processQueue
  }
} 