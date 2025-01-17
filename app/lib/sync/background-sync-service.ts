/**
 * Background Sync Service
 * Last Updated: 2024-01-15
 * 
 * Provides reliable background synchronization for offline-first operations.
 * Implements queue management, error handling, and monitoring.
 */

import { Database } from '@/lib/database/database.types'
import { DatabaseError, ErrorCode } from '@/lib/database/base/errors'
import { SupabaseClient } from '@supabase/supabase-js'
import { SyncStorage } from './storage'

// Helper type to get the row type for a table
type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Helper type to get the insert type for a table
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']

// Helper type to get the update type for a table
type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Types for sync operations
export type SyncOperation = {
  id: string
  type: 'create' | 'update' | 'delete'
  table: keyof Database['public']['Tables']
  data: TableRow<keyof Database['public']['Tables']> | TableInsert<keyof Database['public']['Tables']> | TableUpdate<keyof Database['public']['Tables']>
  timestamp: string
  retryCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

// Type for sync stats
export type SyncStats = {
  pending: number
  processing: number
  completed: number
  failed: number
  lastSync: string | null
  lastError: string | null
}

/**
 * Background Sync Service
 * Manages offline-first operations with reliable synchronization
 */
export class BackgroundSyncService {
  private isProcessing = false
  private maxRetries = 3
  private retryDelay = 1000 // 1 second

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly storage: SyncStorage
  ) {}

  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize storage if needed
      await this.storage.initialize()
      
      // Start processing any pending operations
      await this.processPendingOperations()
      
      // Setup network status monitoring
      this.setupNetworkMonitoring()
    } catch (error) {
      this.handleError('Failed to initialize sync service', error)
    }
  }

  /**
   * Add an operation to the sync queue
   */
  public async addOperation<T extends keyof Database['public']['Tables']>(
    type: SyncOperation['type'],
    table: T,
    data: TableRow<T> | TableInsert<T> | TableUpdate<T>
  ): Promise<void> {
    try {
      const operation: SyncOperation = {
        id: crypto.randomUUID(),
        type,
        table,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending'
      }

      await this.storage.addOperation(operation)
      
      // If we're online, process operations immediately
      if (navigator.onLine) {
        await this.processPendingOperations()
      }
    } catch (error) {
      this.handleError('Failed to add operation to sync queue', error)
    }
  }

  /**
   * Process all pending operations
   */
  private async processPendingOperations(): Promise<void> {
    if (this.isProcessing) return

    try {
      this.isProcessing = true

      const operations = await this.storage.getPendingOperations()
      
      for (const operation of operations) {
        try {
          // Mark operation as processing
          operation.status = 'processing'
          await this.storage.updateOperation(operation)

          // Process the operation
          await this.processOperation(operation)

          // Mark operation as completed
          operation.status = 'completed'
          await this.storage.updateOperation(operation)
        } catch (error) {
          // Handle operation failure
          if (operation.retryCount < this.maxRetries) {
            operation.retryCount++
            operation.status = 'pending'
            operation.error = error instanceof Error ? error.message : 'Unknown error'
            await this.storage.updateOperation(operation)
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.retryDelay))
          } else {
            operation.status = 'failed'
            operation.error = error instanceof Error ? error.message : 'Unknown error'
            await this.storage.updateOperation(operation)
            this.handleError(`Failed to process operation ${operation.id}`, error)
          }
        }
      }
    } catch (error) {
      this.handleError('Failed to process pending operations', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await this.processCreateOperation(operation)
        break
      case 'update':
        await this.processUpdateOperation(operation)
        break
      case 'delete':
        await this.processDeleteOperation(operation)
        break
      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  /**
   * Process a create operation
   */
  private async processCreateOperation(operation: SyncOperation): Promise<void> {
    const { error } = await this.supabase
      .from(operation.table)
      .insert(operation.data as TableInsert<typeof operation.table>)

    if (error) {
      throw new DatabaseError(
        ErrorCode.INSERT_FAILED,
        `Failed to create record in ${operation.table}`,
        { originalError: error }
      )
    }
  }

  /**
   * Process an update operation
   */
  private async processUpdateOperation(operation: SyncOperation): Promise<void> {
    const data = operation.data as TableUpdate<typeof operation.table>
    
    if (!data.id) {
      throw new DatabaseError(
        ErrorCode.UPDATE_FAILED,
        `Cannot update record in ${operation.table}: missing id`,
        { data }
      )
    }

    const { error } = await this.supabase
      .from(operation.table)
      .update(data)
      .eq('id', data.id)

    if (error) {
      throw new DatabaseError(
        ErrorCode.UPDATE_FAILED,
        `Failed to update record in ${operation.table}`,
        { originalError: error }
      )
    }
  }

  /**
   * Process a delete operation
   */
  private async processDeleteOperation(operation: SyncOperation): Promise<void> {
    const data = operation.data as TableRow<typeof operation.table>
    const { error } = await this.supabase
      .from(operation.table)
      .delete()
      .eq('id', data.id)

    if (error) {
      throw new DatabaseError(
        ErrorCode.DELETE_FAILED,
        `Failed to delete record in ${operation.table}`,
        { originalError: error }
      )
    }
  }

  /**
   * Setup network status monitoring
   */
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.processPendingOperations()
    })
  }

  /**
   * Get current sync statistics
   */
  public async getStats(): Promise<SyncStats> {
    try {
      const operations = await this.storage.getAllOperations()
      
      return {
        pending: operations.filter((op: SyncOperation) => op.status === 'pending').length,
        processing: operations.filter((op: SyncOperation) => op.status === 'processing').length,
        completed: operations.filter((op: SyncOperation) => op.status === 'completed').length,
        failed: operations.filter((op: SyncOperation) => op.status === 'failed').length,
        lastSync: operations
          .filter((op: SyncOperation) => op.status === 'completed')
          .sort((a: SyncOperation, b: SyncOperation) => b.timestamp.localeCompare(a.timestamp))[0]?.timestamp || null,
        lastError: operations
          .filter((op: SyncOperation) => op.status === 'failed')
          .sort((a: SyncOperation, b: SyncOperation) => b.timestamp.localeCompare(a.timestamp))[0]?.error || null
      }
    } catch (error) {
      this.handleError('Failed to get sync stats', error)
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        lastSync: null,
        lastError: null
      }
    }
  }

  /**
   * Handle and log errors
   */
  private handleError(message: string, error: unknown): void {
    console.error(message, error)
    // TODO: Add proper error logging/monitoring
    // This should integrate with your application's error tracking system
  }
} 