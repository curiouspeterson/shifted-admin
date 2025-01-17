/**
 * IndexedDB Utilities
 * Last Updated: 2024-03-20
 * 
 * This module provides utilities for working with IndexedDB,
 * including database initialization and error handling.
 */

import { errorLogger } from '@/lib/logging/error-logger'

interface DBSchema {
  offlineData: {
    key: string
    value: unknown
  }
  syncQueue: {
    key: string
    value: unknown
  }
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
      code: error instanceof DOMException ? error.code.toString() : undefined,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  if (error instanceof DOMException) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code.toString()
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

/**
 * Open IndexedDB connection with proper error handling
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offlineStore', 1)

    request.onerror = () => {
      const error = request.error
      errorLogger.error('Failed to open IndexedDB', { 
        error: error ? formatError(error) : undefined 
      })
      reject(error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData')
      }
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue')
      }
    }
  })
}

/**
 * Save data to IndexedDB with proper error handling
 */
export async function saveToStore<K extends keyof DBSchema>(
  storeName: K,
  key: DBSchema[K]['key'],
  value: DBSchema[K]['value']
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  
  return new Promise((resolve, reject) => {
    const request = store.put(value, key)
    
    request.onerror = () => {
      const error = request.error
      errorLogger.error('Failed to save to IndexedDB', {
        error: error ? formatError(error) : undefined,
        storeName,
        key
      })
      reject(error)
    }
    
    request.onsuccess = () => resolve()
  })
}

/**
 * Load data from IndexedDB with proper error handling
 */
export async function loadFromStore<K extends keyof DBSchema>(
  storeName: K,
  key: DBSchema[K]['key']
): Promise<DBSchema[K]['value'] | null> {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readonly')
  const store = tx.objectStore(storeName)
  
  return new Promise((resolve, reject) => {
    const request = store.get(key)
    
    request.onerror = () => {
      const error = request.error
      errorLogger.error('Failed to load from IndexedDB', {
        error: error ? formatError(error) : undefined,
        storeName,
        key
      })
      reject(error)
    }
    
    request.onsuccess = () => resolve(request.result ?? null)
  })
}

/**
 * Delete data from IndexedDB with proper error handling
 */
export async function deleteFromStore<K extends keyof DBSchema>(
  storeName: K,
  key: DBSchema[K]['key']
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  
  return new Promise((resolve, reject) => {
    const request = store.delete(key)
    
    request.onerror = () => {
      const error = request.error
      errorLogger.error('Failed to delete from IndexedDB', {
        error: error ? formatError(error) : undefined,
        storeName,
        key
      })
      reject(error)
    }
    
    request.onsuccess = () => resolve()
  })
} 