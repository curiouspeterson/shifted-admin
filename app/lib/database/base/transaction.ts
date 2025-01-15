/**
 * Transaction Manager
 * Last Updated: 2024-03-20
 * 
 * This class provides transaction management for database operations.
 * It includes automatic rollback on error and improved error handling.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { DatabaseError, ErrorCodes, mapDatabaseError } from './errors'
import { errorLogger } from '@/lib/logging/error-logger'

export type TransactionFunction<T> = (client: SupabaseClient<Database>) => Promise<DatabaseResult<T>>

export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
}

export class TransactionManager {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(fn: TransactionFunction<T>): Promise<DatabaseResult<T>> {
    const startTime = Date.now()

    try {
      // Start transaction
      const { error: beginError } = await this.supabase.rpc('begin_transaction')
      if (beginError) {
        throw beginError
      }

      errorLogger.debug('Transaction started', {
        timestamp: new Date().toISOString()
      })

      // Execute transaction function
      const result = await fn(this.supabase)

      if (result.error) {
        // Rollback on error
        const { error: rollbackError } = await this.supabase.rpc('rollback_transaction')
        if (rollbackError) {
          throw rollbackError
        }

        errorLogger.error('Transaction rolled back due to error', {
          error: result.error,
          duration: Date.now() - startTime
        })

        return result
      }

      // Commit transaction
      const { error: commitError } = await this.supabase.rpc('commit_transaction')
      if (commitError) {
        throw commitError
      }

      errorLogger.debug('Transaction committed successfully', {
        duration: Date.now() - startTime
      })

      return result
    } catch (err) {
      // Attempt rollback
      try {
        await this.supabase.rpc('rollback_transaction')
      } catch (rollbackErr) {
        errorLogger.error('Failed to rollback transaction', {
          error: mapDatabaseError(rollbackErr),
          originalError: mapDatabaseError(err),
          duration: Date.now() - startTime
        })
      }

      const error = mapDatabaseError(err)
      errorLogger.error('Transaction failed', {
        error,
        duration: Date.now() - startTime
      })

      return {
        data: null,
        error: new DatabaseError(
          ErrorCodes.TRANSACTION_FAILED,
          'Transaction failed',
          { cause: error }
        )
      }
    }
  }

  /**
   * Execute a transaction that returns an array of results
   */
  async transactionArray<T>(fn: TransactionFunction<T[]>): Promise<DatabaseResult<T[]>> {
    const result = await this.transaction(fn)
    return {
      data: result.data || [],
      error: result.error
    }
  }
} 