/**
 * Background Sync Service
 * Last Updated: 2025-03-19
 * 
 * Handles offline operations and background synchronization
 * with proper queue processing and error handling.
 */

import { z } from 'zod'
import { ERROR_CODES } from '@/lib/constants'
import type { ApiError } from '@/lib/types'

/**
 * Queue operation types
 */
export enum QueueOperationType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

/**
 * Queue priority levels
 */
export enum QueuePriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

/**
 * Queue item schema with version control
 */
export const queueItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([QueueOperationType.Create, QueueOperationType.Update, QueueOperationType.Delete]),
  resource: z.string(),
  data: z.record(z.unknown()),
  priority: z.nativeEnum(QueuePriority),
  version: z.number().int().nonnegative(),
  retries: z.number().int().nonnegative(),
  lastError: z.string().optional(),
  lastAttempt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type QueueItem = z.infer<typeof queueItemSchema>

interface QueueStats {
  total: number
  pending: number
  failed: number
  retrying: number
}

/**
 * Background sync service for handling offline operations
 */
export class BackgroundSyncService {
  private queue: QueueItem[] = []
  private isProcessing = false
  private maxRetries = 3
  private retryDelay = 1000 // 1 second
  private maxBatchSize = 10
  private storage: Storage
  private stats: QueueStats = {
    total: 0,
    pending: 0,
    failed: 0,
    retrying: 0,
  }

  constructor(storage: Storage = localStorage) {
    this.storage = storage
    this.loadQueue()
    this.setupNetworkListeners()
    this.startQueueMonitoring()
  }

  /**
   * Add an operation to the queue
   */
  public async addToQueue(
    type: QueueOperationType,
    resource: string,
    data: Record<string, unknown>,
    priority: QueuePriority = QueuePriority.Medium
  ): Promise<void> {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      type,
      resource,
      data,
      priority,
      version: 1,
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Validate the queue item
    try {
      queueItemSchema.parse(item)
    } catch (error) {
      console.error('Invalid queue item:', error)
      throw new Error('Invalid queue item')
    }

    // Add to queue and sort by priority
    this.queue.push(item)
    this.sortQueue()
    await this.saveQueue()
    this.updateStats()
    this.processQueue()
  }

  /**
   * Sort queue by priority and creation time
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by priority
      const priorityOrder = {
        [QueuePriority.High]: 0,
        [QueuePriority.Medium]: 1,
        [QueuePriority.Low]: 2,
      }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Then sort by creation time
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  /**
   * Process the queue of pending operations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return
    }

    this.isProcessing = true

    try {
      // Process items in batches
      const batch = this.queue.slice(0, this.maxBatchSize)
      await Promise.all(batch.map(item => this.processItem(item)))
      
      // Remove processed items
      this.queue.splice(0, batch.length)
      await this.saveQueue()
      this.updateStats()
    } catch (error) {
      console.error('Error processing queue:', error)
    } finally {
      this.isProcessing = false
      if (this.queue.length > 0) {
        // Continue processing after a short delay
        setTimeout(() => this.processQueue(), 100)
      }
    }
  }

  /**
   * Process a single queue item with error handling
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      // Update last attempt timestamp
      item.lastAttempt = new Date().toISOString()
      await this.saveQueue()

      // Process based on operation type
      switch (item.type) {
        case QueueOperationType.Create:
          await this.handleCreate(item.resource, item.data)
          break
        case QueueOperationType.Update:
          await this.handleUpdate(item.resource, item.data)
          break
        case QueueOperationType.Delete:
          await this.handleDelete(item.resource, item.data)
          break
        default:
          throw new Error(`Unknown operation type: ${item.type}`)
      }
    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        const apiError = error as ApiError
        
        switch (apiError.code) {
          case ERROR_CODES.CONFLICT:
            await this.handleConflict(item)
            break
          case ERROR_CODES.RATE_LIMIT_ERROR:
            await this.handleRateLimit(item)
            break
          case ERROR_CODES.VALIDATION_ERROR:
            await this.handleValidationError(item, apiError)
            break
          default:
            await this.handleGenericError(item, apiError)
        }
      }

      throw error
    }
  }

  /**
   * Handle rate limit errors
   */
  private async handleRateLimit(item: QueueItem): Promise<void> {
    // Add exponential backoff
    const delay = this.retryDelay * Math.pow(2, item.retries)
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Increment retries and update timestamp
    item.retries++
    item.updatedAt = new Date().toISOString()
    await this.saveQueue()
  }

  /**
   * Handle validation errors
   */
  private async handleValidationError(item: QueueItem, error: ApiError): Promise<void> {
    // Log validation error details
    console.error('Validation error:', error.details)
    
    // Move to dead letter queue immediately
    await this.moveToDeadLetterQueue(item)
    this.queue = this.queue.filter(i => i.id !== item.id)
    await this.saveQueue()
  }

  /**
   * Handle generic errors
   */
  private async handleGenericError(item: QueueItem, error: ApiError): Promise<void> {
    item.lastError = error.message
    item.retries++
    item.updatedAt = new Date().toISOString()

    if (item.retries >= this.maxRetries) {
      await this.moveToDeadLetterQueue(item)
      this.queue = this.queue.filter(i => i.id !== item.id)
    }

    await this.saveQueue()
  }

  /**
   * Handle conflicts with version control
   */
  private async handleConflict(item: QueueItem): Promise<void> {
    const { resource, data, version } = item
    const id = data['id']
    if (typeof id !== 'string') {
      throw new Error('Invalid id in conflict data')
    }

    // Fetch latest version
    const response = await fetch(`/api/${resource}/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch latest ${resource} data`)
    }

    const latestData = await response.json()
    const latestVersion = latestData.version || 0

    // Only merge if our version is not too old
    if (version >= latestVersion - 5) {
      const mergedData = this.mergeChanges(latestData, data)
      item.data = mergedData
      item.version = latestVersion + 1
      item.updatedAt = new Date().toISOString()
      await this.saveQueue()
    } else {
      // Version too old, move to dead letter queue
      await this.moveToDeadLetterQueue(item)
      this.queue = this.queue.filter(i => i.id !== item.id)
      await this.saveQueue()
    }
  }

  /**
   * Merge changes with timestamp-based conflict resolution
   */
  private mergeChanges(
    latest: Record<string, unknown>,
    queued: Record<string, unknown>
  ): Record<string, unknown> {
    const merged = { ...latest }
    
    // Compare timestamps for each field
    for (const [key, value] of Object.entries(queued)) {
      const latestTimestamp = latest[`${key}_updated_at`] as string || latest['updatedAt'] as string
      const queuedTimestamp = queued[`${key}_updated_at`] as string || queued['updatedAt'] as string
      
      if (typeof latestTimestamp === 'string' && 
          typeof queuedTimestamp === 'string' && 
          new Date(queuedTimestamp) > new Date(latestTimestamp)) {
        merged[key] = value
        merged[`${key}_updated_at`] = queuedTimestamp
      }
    }

    const currentVersion = (latest['version'] as number) || 0
    merged['version'] = currentVersion + 1
    merged['updatedAt'] = new Date().toISOString()
    
    return merged
  }

  /**
   * Update queue statistics
   */
  private updateStats(): void {
    this.stats = {
      total: this.queue.length,
      pending: this.queue.filter(item => item.retries === 0).length,
      failed: this.queue.filter(item => item.retries >= this.maxRetries).length,
      retrying: this.queue.filter(item => item.retries > 0 && item.retries < this.maxRetries).length,
    }
  }

  /**
   * Start queue monitoring
   */
  private startQueueMonitoring(): void {
    setInterval(() => {
      this.updateStats()
      
      // Log queue status
      console.debug('Queue stats:', this.stats)
      
      // Auto-retry failed items periodically
      if (this.stats.failed > 0) {
        this.retryFailedItems()
      }
    }, 60000) // Every minute
  }

  /**
   * Retry failed items
   */
  private async retryFailedItems(): Promise<void> {
    const failedItems = this.queue.filter(item => item.retries >= this.maxRetries)
    
    for (const item of failedItems) {
      // Reset retry count and try again
      item.retries = 0
      item.lastError = undefined
      item.updatedAt = new Date().toISOString()
    }

    await this.saveQueue()
    this.processQueue()
  }

  /**
   * Get current queue statistics
   */
  public getStats(): QueueStats {
    return { ...this.stats }
  }

  /**
   * Load the queue from storage
   */
  private loadQueue(): void {
    const queueData = this.storage.getItem('backgroundSyncQueue')
    if (typeof queueData !== 'string' || queueData.length === 0) {
      this.queue = []
      return
    }

    try {
      const parsedData = JSON.parse(queueData)
      const isValidQueue = Array.isArray(parsedData) && 
        parsedData.every(item => {
          try {
            queueItemSchema.parse(item)
            return true
          } catch {
            return false
          }
        })

      this.queue = isValidQueue ? parsedData : []
    } catch (error) {
      console.error('Failed to load background sync queue:', error)
      this.queue = []
    }
  }

  /**
   * Save the queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      this.storage.setItem('backgroundSyncQueue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save background sync queue:', error)
    }
  }

  /**
   * Load the dead letter queue from storage
   */
  private loadDeadLetterQueue(): QueueItem[] {
    const queueData = this.storage.getItem('deadLetterQueue')
    if (typeof queueData !== 'string' || queueData.length === 0) {
      return []
    }

    try {
      const parsedData = JSON.parse(queueData)
      const isValidQueue = Array.isArray(parsedData) && 
        parsedData.every(item => {
          try {
            queueItemSchema.parse(item)
            return true
          } catch {
            return false
          }
        })

      return isValidQueue ? parsedData : []
    } catch (error) {
      console.error('Failed to load dead letter queue:', error)
    }
    return []
  }

  /**
   * Save the dead letter queue to storage
   */
  private async saveDeadLetterQueue(queue: QueueItem[]): Promise<void> {
    try {
      this.storage.setItem('deadLetterQueue', JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save dead letter queue:', error)
    }
  }

  /**
   * Move failed items to dead letter queue
   */
  private async moveToDeadLetterQueue(item: QueueItem): Promise<void> {
    const deadLetterQueue = this.loadDeadLetterQueue()
    deadLetterQueue.push(item)
    await this.saveDeadLetterQueue(deadLetterQueue)
  }

  /**
   * Handle create operations
   */
  private async handleCreate(resource: string, data: Record<string, unknown>): Promise<void> {
    const response = await fetch(`/api/${resource}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create ${resource}`)
    }
  }

  /**
   * Handle update operations
   */
  private async handleUpdate(resource: string, data: Record<string, unknown>): Promise<void> {
    const id = data['id']
    if (typeof id !== 'string') {
      throw new Error('Invalid id in update data')
    }

    const response = await fetch(`/api/${resource}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update ${resource}`)
    }
  }

  /**
   * Handle delete operations
   */
  private async handleDelete(resource: string, data: Record<string, unknown>): Promise<void> {
    const id = data['id']
    if (typeof id !== 'string') {
      throw new Error('Invalid id in delete data')
    }

    const response = await fetch(`/api/${resource}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete ${resource}`)
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isProcessing = false
    })
  }
} 