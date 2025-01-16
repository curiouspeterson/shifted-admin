/**
 * Local Storage Implementation for Sync Operations
 * Last Updated: 2024-01-15
 * 
 * Implements the SyncStorage interface using browser's localStorage
 * with proper error handling and data validation.
 */

import { SyncOperation } from './backgroundSyncService'
import { SyncStorage } from './storage'

const STORAGE_KEY = 'sync_operations'
const MAX_OPERATIONS = 1000 // Prevent unlimited storage growth

/**
 * Local storage implementation of SyncStorage
 */
export class LocalSyncStorage implements SyncStorage {
  private operations: SyncOperation[] = []
  private initialized = false

  /**
   * Initialize storage and load existing operations
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.every(this.isValidOperation)) {
          this.operations = parsed
        } else {
          console.warn('Invalid stored operations found, starting fresh')
          this.operations = []
        }
      }
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize sync storage', error)
      this.operations = []
      this.initialized = true
    }
  }

  /**
   * Add a new operation to storage
   */
  public async addOperation(operation: SyncOperation): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (this.operations.length >= MAX_OPERATIONS) {
      // Remove completed operations if we're at capacity
      this.operations = this.operations.filter(op => op.status !== 'completed')
      
      // If still at capacity, remove oldest failed operations
      if (this.operations.length >= MAX_OPERATIONS) {
        this.operations = this.operations
          .filter(op => op.status !== 'failed')
          .slice(-MAX_OPERATIONS)
      }
      
      // If still at capacity, remove oldest operations
      if (this.operations.length >= MAX_OPERATIONS) {
        this.operations = this.operations.slice(-MAX_OPERATIONS)
      }
    }

    this.operations.push(operation)
    await this.persist()
  }

  /**
   * Update an existing operation
   */
  public async updateOperation(operation: SyncOperation): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    const index = this.operations.findIndex(op => op.id === operation.id)
    if (index === -1) {
      throw new Error(`Operation not found: ${operation.id}`)
    }

    this.operations[index] = operation
    await this.persist()
  }

  /**
   * Get all pending operations
   */
  public async getPendingOperations(): Promise<SyncOperation[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    return this.operations.filter(op => op.status === 'pending')
  }

  /**
   * Get all operations
   */
  public async getAllOperations(): Promise<SyncOperation[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    return [...this.operations]
  }

  /**
   * Delete completed operations older than the specified date
   */
  public async cleanupOldOperations(before: Date): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    const beforeTimestamp = before.toISOString()
    this.operations = this.operations.filter(op => 
      op.status !== 'completed' || op.timestamp > beforeTimestamp
    )
    
    await this.persist()
  }

  /**
   * Persist operations to localStorage
   */
  private async persist(): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.operations))
    } catch (error) {
      console.error('Failed to persist operations', error)
      throw error
    }
  }

  /**
   * Validate operation structure
   */
  private isValidOperation(value: unknown): value is SyncOperation {
    if (!value || typeof value !== 'object') return false
    
    const op = value as any
    return (
      typeof op.id === 'string' &&
      ['create', 'update', 'delete'].includes(op.type) &&
      typeof op.table === 'string' &&
      typeof op.timestamp === 'string' &&
      typeof op.retryCount === 'number' &&
      ['pending', 'processing', 'completed', 'failed'].includes(op.status) &&
      (op.error === undefined || typeof op.error === 'string')
    )
  }
} 