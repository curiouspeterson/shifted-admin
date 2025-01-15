/**
 * IndexedDB Storage Wrapper
 * Last Updated: 2024-03-20
 * 
 * This module provides a wrapper around IndexedDB for offline data storage
 * with type safety and error handling.
 */

import { errorLogger } from '@/lib/logging/error-logger'

const DB_NAME = 'shifted-admin'
const DB_VERSION = 1

interface StorageItem<T> {
  id: string
  data: T
  timestamp: number
  synced: boolean
  version?: number
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
  if (error instanceof DOMException) {
    return {
      name: error.name,
      message: error.message,
      code: String(error.code),
      stack: error.stack
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

/**
 * IndexedDB wrapper class
 */
export class IndexedDB {
  private static instance: IndexedDB
  private db: IDBDatabase | null = null

  private constructor() {}

  static getInstance(): IndexedDB {
    if (!IndexedDB.instance) {
      IndexedDB.instance = new IndexedDB()
    }
    return IndexedDB.instance
  }

  /**
   * Initialize database
   */
  async init(): Promise<void> {
    if (this.db) return

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        errorLogger.error('Failed to open IndexedDB', {
          error: formatError(error)
        })
      }

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest).result
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('shifts')) {
          db.createObjectStore('shifts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('employees')) {
          db.createObjectStore('employees', { keyPath: 'id' })
        }
      }

      this.db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      errorLogger.error('Failed to initialize IndexedDB', {
        error: formatError(error)
      })
      throw error
    }
  }

  /**
   * Store item
   */
  async set<T>(store: string, item: StorageItem<T>): Promise<void> {
    if (!this.db) await this.init()

    try {
      const tx = this.db!.transaction(store, 'readwrite')
      const objectStore = tx.objectStore(store)

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.put(item)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      errorLogger.error('Failed to store item in IndexedDB', {
        error: formatError(error),
        store,
        itemId: item.id
      })
      throw error
    }
  }

  /**
   * Get item by id
   */
  async get<T>(store: string, id: string): Promise<StorageItem<T> | null> {
    if (!this.db) await this.init()

    try {
      const tx = this.db!.transaction(store, 'readonly')
      const objectStore = tx.objectStore(store)

      const item = await new Promise<StorageItem<T> | null>((resolve, reject) => {
        const request = objectStore.get(id)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      return item
    } catch (error) {
      errorLogger.error('Failed to get item from IndexedDB', {
        error: formatError(error),
        store,
        id
      })
      throw error
    }
  }

  /**
   * Get all items from store
   */
  async getAll<T>(store: string): Promise<StorageItem<T>[]> {
    if (!this.db) await this.init()

    try {
      const tx = this.db!.transaction(store, 'readonly')
      const objectStore = tx.objectStore(store)

      const items = await new Promise<StorageItem<T>[]>((resolve, reject) => {
        const request = objectStore.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      return items
    } catch (error) {
      errorLogger.error('Failed to get all items from IndexedDB', {
        error: formatError(error),
        store
      })
      throw error
    }
  }

  /**
   * Delete item by id
   */
  async delete(store: string, id: string): Promise<void> {
    if (!this.db) await this.init()

    try {
      const tx = this.db!.transaction(store, 'readwrite')
      const objectStore = tx.objectStore(store)

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      errorLogger.error('Failed to delete item from IndexedDB', {
        error: formatError(error),
        store,
        id
      })
      throw error
    }
  }

  /**
   * Clear store
   */
  async clear(store: string): Promise<void> {
    if (!this.db) await this.init()

    try {
      const tx = this.db!.transaction(store, 'readwrite')
      const objectStore = tx.objectStore(store)

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      errorLogger.error('Failed to clear store in IndexedDB', {
        error: formatError(error),
        store
      })
      throw error
    }
  }
}

// Export singleton instance
export const indexedDB = IndexedDB.getInstance() 