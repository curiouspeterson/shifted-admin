/**
 * Transaction Manager
 * Last Updated: 2024-03-19 19:10 PST
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseResult, TransactionFunction } from './types';
import { DatabaseError, ErrorCodes } from './errors';
import { logger } from './logging';

export class TransactionManager {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(
    fn: TransactionFunction<T>
  ): Promise<DatabaseResult<T>> {
    try {
      await this.supabase.rpc('begin_transaction');
      logger.debug('Transaction started');

      const result = await fn(this.supabase);

      if (result.error) {
        await this.supabase.rpc('rollback_transaction');
        logger.error('Transaction rolled back due to error', {
          error: result.error,
        });
        return result;
      }

      await this.supabase.rpc('commit_transaction');
      logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      await this.supabase.rpc('rollback_transaction');
      logger.error('Transaction rolled back due to exception', { error });

      return {
        data: null,
        error: new DatabaseError(
          ErrorCodes.TRANSACTION_FAILED,
          'Transaction failed',
          error
        ),
      };
    }
  }

  /**
   * Execute a transaction that returns an array result
   */
  async transactionArray<T>(
    fn: TransactionFunction<T[]>
  ): Promise<DatabaseResult<T[]>> {
    try {
      await this.supabase.rpc('begin_transaction');
      logger.debug('Transaction started');

      const result = await fn(this.supabase);

      if (result.error) {
        await this.supabase.rpc('rollback_transaction');
        logger.error('Transaction rolled back due to error', {
          error: result.error,
        });
        return result;
      }

      await this.supabase.rpc('commit_transaction');
      logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      await this.supabase.rpc('rollback_transaction');
      logger.error('Transaction rolled back due to exception', { error });

      return {
        data: null,
        error: new DatabaseError(
          ErrorCodes.TRANSACTION_FAILED,
          'Transaction failed',
          error
        ),
      };
    }
  }
} 