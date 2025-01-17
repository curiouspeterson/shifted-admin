/**
 * Local Storage Sync Implementation
 * Last Updated: 2025-01-16
 * 
 * Implements the SyncStorage interface using localStorage
 */

import { type SyncOperation, type SyncStorage } from '@/lib/types/sync';
import { safeJsonParse } from '@/lib/utils';
import { errorLogger } from '@/lib/logging/error-logger';

const STORAGE_KEY = 'sync_operations';
const MAX_OPERATIONS = 1000; // Prevent unlimited storage growth

export class LocalStorageSync implements SyncStorage {
  private operations: SyncOperation[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (typeof window === 'undefined') {
        throw new Error('LocalStorageSync can only be used in the browser');
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      this.operations = stored ? safeJsonParse<SyncOperation[]>(stored, []) : [];
      this.isInitialized = true;
    } catch (error) {
      errorLogger.error('Failed to initialize local storage sync', { error });
      throw error;
    }
  }

  private async persist(): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.operations));
    } catch (error) {
      errorLogger.error('Failed to persist sync operations', { error });
      throw error;
    }
  }

  async addOperation(operation: SyncOperation): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Prevent storage from growing too large
      if (this.operations.length >= MAX_OPERATIONS) {
        // Remove completed operations first
        this.operations = this.operations.filter(op => op.status !== 'completed');
        
        // If still too many, remove the oldest
        if (this.operations.length >= MAX_OPERATIONS) {
          this.operations = this.operations
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_OPERATIONS - 1);
        }
      }

      this.operations.push(operation);
      await this.persist();
    } catch (error) {
      errorLogger.error('Failed to add sync operation', { error, operation });
      throw error;
    }
  }

  async updateOperation(operation: SyncOperation): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.operations.findIndex(op => op.id === operation.id);
      if (index === -1) {
        throw new Error(`Operation not found: ${operation.id}`);
      }

      this.operations[index] = operation;
      await this.persist();
    } catch (error) {
      errorLogger.error('Failed to update sync operation', { error, operation });
      throw error;
    }
  }

  async getPendingOperations(): Promise<SyncOperation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.operations.filter(op => op.status === 'pending');
  }

  async getAllOperations(): Promise<SyncOperation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return [...this.operations];
  }

  async cleanupOldOperations(before: Date): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const timestamp = before.getTime();
      this.operations = this.operations.filter(op => {
        // Keep all pending and processing operations
        if (op.status === 'pending' || op.status === 'processing') {
          return true;
        }
        // Remove completed and failed operations older than the specified date
        return op.timestamp > timestamp;
      });

      await this.persist();
    } catch (error) {
      errorLogger.error('Failed to cleanup old operations', { error, before });
      throw error;
    }
  }
} 