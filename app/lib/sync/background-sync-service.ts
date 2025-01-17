/**
 * Background Sync Service
 * Last Updated: 2025-01-16
 * 
 * Handles background synchronization of data with proper error handling
 */

import { type SyncOperation, type SyncStorage, type SyncStats } from '@/lib/types/sync';
import { errorLogger } from '@/lib/logging/error-logger';

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private isInitialized = false;
  private isProcessing = false;

  private constructor(
    private readonly storage: SyncStorage,
    private readonly config: {
      maxRetries: number;
      retryDelay: number;
      onSyncComplete?: () => void;
      onSyncError?: (error: Error) => void;
    } = {
      maxRetries: 3,
      retryDelay: 5000,
    }
  ) {}

  static getInstance(storage: SyncStorage, config?: {
    maxRetries?: number;
    retryDelay?: number;
    onSyncComplete?: () => void;
    onSyncError?: (error: Error) => void;
  }): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService(storage, {
        maxRetries: config?.maxRetries ?? 3,
        retryDelay: config?.retryDelay ?? 5000,
        onSyncComplete: config?.onSyncComplete,
        onSyncError: config?.onSyncError,
      });
    }
    return BackgroundSyncService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.storage.initialize();
      this.isInitialized = true;
      
      // Start processing if we're online
      if (typeof window !== 'undefined' && navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      errorLogger.error('Failed to initialize background sync', { error });
      throw error;
    }
  }

  async addOperation(type: SyncOperation['type'], endpoint: string, payload: unknown): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      type,
      endpoint,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      await this.storage.addOperation(operation);
      
      if (!this.isProcessing && navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      errorLogger.error('Failed to add sync operation', { error, operation });
      throw error;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;

    this.isProcessing = true;

    try {
      const operations = await this.storage.getPendingOperations();
      
      for (const operation of operations) {
        try {
          operation.status = 'processing';
          await this.storage.updateOperation(operation);

          await this.processOperation(operation);

          operation.status = 'completed';
          await this.storage.updateOperation(operation);
        } catch (error) {
          errorLogger.error('Failed to process operation', { error, operation });

          if (operation.retryCount < this.config.maxRetries) {
            operation.retryCount++;
            operation.status = 'pending';
            await this.storage.updateOperation(operation);
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          } else {
            operation.status = 'failed';
            await this.storage.updateOperation(operation);
            this.config.onSyncError?.(error as Error);
          }
        }
      }

      this.config.onSyncComplete?.();
    } catch (error) {
      errorLogger.error('Failed to process sync queue', { error });
      this.config.onSyncError?.(error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process operation');
    }
  }

  async getStats(): Promise<SyncStats> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const operations = await this.storage.getAllOperations();
      
      return {
        pending: operations.filter(op => op.status === 'pending').length,
        processing: operations.filter(op => op.status === 'processing').length,
        completed: operations.filter(op => op.status === 'completed').length,
        failed: operations.filter(op => op.status === 'failed').length,
        lastSync: operations.find(op => op.status === 'completed')?.timestamp.toString() ?? null,
        lastError: operations.find(op => op.status === 'failed')?.timestamp.toString() ?? null,
      };
    } catch (error) {
      errorLogger.error('Failed to get sync stats', { error });
      throw error;
    }
  }
} 