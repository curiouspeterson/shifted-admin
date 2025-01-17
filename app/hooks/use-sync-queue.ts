/**
 * Sync Queue Hook
 * Last Updated: 2024-03-20
 * 
 * This hook manages a queue of offline changes that need to be
 * synchronized with the server when connectivity is restored.
 */

import { useState, useEffect, useCallback } from 'react'
import { errorLogger } from '@/lib/logging/error-logger'
import { openDB, saveToStore, loadFromStore, deleteFromStore } from '@/lib/database/indexedDB'

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
    await saveToStore('syncQueue', syncOp.id, syncOp)
    setQueue(prev => [...prev, syncOp])
    
    // Start sync if online
    if (navigator.onLine) {
      processQueue()
    }
  }, [])

  // Process queue
  const processQueue = useCallback(async () => {
    if (isSyncing || queue.length === 0) return

    setIsSyncing(true)
    const currentOp = queue[0]

    try {
      await syncFn(currentOp)
      
      // Remove from queue on success
      await deleteFromStore('syncQueue', currentOp.id)
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
        await saveToStore('syncQueue', currentOp.id, updatedOp)
        setQueue(prev => [updatedOp, ...prev.slice(1)])
        
        setTimeout(processQueue, retryDelay)
      } else {
        // Move to end of queue after max retries
        const failedOp = {
          ...currentOp,
          status: 'failed' as const
        }
        await saveToStore('syncQueue', currentOp.id, failedOp)
        setQueue(prev => [...prev.slice(1), failedOp])
      }
    } finally {
      setIsSyncing(false)
    }
  }, [queue, isSyncing, syncFn, maxRetries, retryDelay])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      processQueue()
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [processQueue])

  // Load queue from IndexedDB on mount
  useEffect(() => {
    async function loadQueue() {
      try {
        const operations = await loadFromStore('syncQueue', key)
        if (operations) {
          setQueue(operations as SyncOperation<T>[])
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
    processQueue
  }
} 