/**
 * Sync Storage Interface
 * Last Updated: 2024-01-15
 * 
 * Defines the interface for storing and managing sync operations.
 */

import { SyncOperation } from './background-sync-service'

/**
 * Interface for sync operation storage
 */
export interface SyncStorage {
  /**
   * Initialize the storage
   */
  initialize(): Promise<void>

  /**
   * Add a new operation to storage
   */
  addOperation(operation: SyncOperation): Promise<void>

  /**
   * Update an existing operation
   */
  updateOperation(operation: SyncOperation): Promise<void>

  /**
   * Get all pending operations
   */
  getPendingOperations(): Promise<SyncOperation[]>

  /**
   * Get all operations
   */
  getAllOperations(): Promise<SyncOperation[]>

  /**
   * Delete completed operations older than the specified date
   */
  cleanupOldOperations(before: Date): Promise<void>
} 