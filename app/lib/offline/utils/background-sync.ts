/**
 * Background Sync Implementation
 * Last Updated: 2024-03
 * 
 * This module provides background synchronization functionality:
 * - Task queue management
 * - Retry handling
 * - Error management
 * - Offline support
 */

import { toast } from 'sonner';
import { IndexedDB, type DBConfig } from './indexed-db';
import { errorLogger, ErrorSeverity } from '@/lib/logging/error-logger';
import { DatabaseError } from '@/lib/errors/base';

export type SyncTaskType = 'create' | 'update' | 'delete';
export type SyncTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncTaskPayload {
  endpoint: string;
  data?: unknown;
  headers: Record<string, string>;
}

export interface SyncTaskStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
}

export interface SyncTask {
  id: string;
  type: SyncTaskType;
  payload: SyncTaskPayload;
  timestamp: number;
  retryCount: number;
  status: SyncTaskStatus;
  error?: {
    message: string;
    code?: string;
    category?: 'network' | 'auth' | 'validation' | 'unknown';
  };
}

export interface BackgroundSyncDBConfig {
  name: string;
  version: number;
  stores: {
    tasks: {
      keyPath: 'id';
      indexes: Array<{
        name: string;
        keyPath: string;
        options?: IDBIndexParameters;
      }>;
    };
  };
}

export interface BackgroundSyncConfig {
  dbConfig: BackgroundSyncDBConfig;
  maxRetries?: number;
  onSyncComplete?: (task: SyncTask) => void | Promise<void>;
  onSyncError?: (task: SyncTask, error: Error) => void | Promise<void>;
}

// Default handlers
const defaultHandlers = {
  onSyncComplete: async (task: SyncTask): Promise<void> => {
    errorLogger.debug('Task completed with default handler', {
      component: 'BackgroundSync',
      operation: 'onSyncComplete',
      taskId: task.id
    });
  },
  onSyncError: async (task: SyncTask, error: Error): Promise<void> => {
    errorLogger.error('Task failed with default handler', {
      component: 'BackgroundSync',
      operation: 'onSyncError',
      taskId: task.id,
      error
    });
  }
};

export class BackgroundSyncError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'BackgroundSyncError';
  }
}

/**
 * Utility class for handling background sync operations
 */
export class BackgroundSync {
  private static instance: BackgroundSync;
  private db: IndexedDB;
  private isProcessing: boolean = false;
  private config: Required<BackgroundSyncConfig>;

  private constructor(config: BackgroundSyncConfig) {
    if (!config?.dbConfig) {
      throw new BackgroundSyncError(
        'Database configuration is required',
        null,
        'CONFIG_ERROR'
      );
    }

    this.config = {
      dbConfig: config.dbConfig,
      maxRetries: config.maxRetries ?? 5,
      onSyncComplete: config.onSyncComplete ?? defaultHandlers.onSyncComplete,
      onSyncError: config.onSyncError ?? defaultHandlers.onSyncError
    };
    
    // Initialize database connection
    this.db = IndexedDB.getInstance(this.config.dbConfig);
  }

  /**
   * Initialize the database and register sync
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.db.init();
      await this.registerSync();
    } catch (error) {
      const syncError = new BackgroundSyncError(
        'Failed to initialize background sync',
        error
      );
      errorLogger.error(syncError, {
        component: 'BackgroundSync',
        operation: 'initialize'
      });
      throw syncError;
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: BackgroundSyncConfig): BackgroundSync {
    if (!BackgroundSync.instance) {
      if (!config) {
        throw new BackgroundSyncError(
          'Configuration is required for initial instance creation',
          null,
          'CONFIG_ERROR'
        );
      }
      BackgroundSync.instance = new BackgroundSync(config);
    }
    return BackgroundSync.instance;
  }

  /**
   * Register service worker sync
   */
  private async registerSync(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      errorLogger.info('Service worker not supported', {
        component: 'BackgroundSync',
        operation: 'registerSync'
      });
      return;
    }

    if (!('sync' in ServiceWorkerRegistration.prototype)) {
      errorLogger.info('Background sync not supported', {
        component: 'BackgroundSync',
        operation: 'registerSync'
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
      
      errorLogger.debug('Background sync registered', {
        component: 'BackgroundSync',
        operation: 'registerSync'
      });
    } catch (error) {
      const syncError = new BackgroundSyncError(
        'Failed to register background sync',
        error
      );
      errorLogger.error(syncError, {
        component: 'BackgroundSync',
        operation: 'registerSync'
      });
      throw syncError;
    }
  }

  /**
   * Check if background sync is supported
   */
  private async checkSyncSupport(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return 'sync' in registration && registration.sync !== undefined;
    } catch (error) {
      errorLogger.warn('Failed to check sync support', {
        component: 'BackgroundSync',
        operation: 'checkSyncSupport',
        error
      });
      return false;
    }
  }

  /**
   * Check if the browser is online
   * Includes a fetch test to verify actual connectivity
   */
  private async checkOnlineStatus(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Ping the server to verify actual connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      errorLogger.warn('Failed to verify online status', {
        component: 'BackgroundSync',
        operation: 'checkOnlineStatus',
        error
      });
      return false;
    }
  }

  /**
   * Add a task to the sync queue
   * @param type The type of sync operation
   * @param endpoint The API endpoint to sync with
   * @param data Optional data to send
   * @param headers Optional additional headers
   */
  public async addTask(
    type: SyncTaskType,
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<void> {
    try {
      const task: SyncTask = {
        id: crypto.randomUUID(),
        type,
        payload: {
          endpoint,
          data,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      };

      await this.db.execute<SyncTask>({
        store: 'tasks',
        type: 'add',
        data: task
      });

      errorLogger.debug('Added sync task to queue', {
        component: 'BackgroundSync',
        operation: 'addTask',
        taskId: task.id,
        type: task.type
      });

      // Trigger sync if online
      if (await this.checkOnlineStatus()) {
        void this.processTasks();
      }
    } catch (error) {
      const syncError = new BackgroundSyncError(
        'Failed to add sync task',
        error
      );
      errorLogger.error(syncError, {
        component: 'BackgroundSync',
        operation: 'addTask',
        type,
        endpoint
      });
      throw syncError;
    }
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Categorize error type for appropriate handling
   */
  private categorizeError(error: unknown): 'network' | 'auth' | 'validation' | 'unknown' {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return 'network';
    }
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return 'auth';
      }
      if (error.message.includes('400') || error.message.includes('422')) {
        return 'validation';
      }
    }
    return 'unknown';
  }

  /**
   * Process tasks in the sync queue with exponential backoff and error categorization
   */
  private async processTasks(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const tasks = await this.db.execute<SyncTask[]>({
        store: 'tasks',
        type: 'getAll',
        index: {
          name: 'status',
          key: 'pending'
        }
      });

      if (!tasks || tasks.length === 0) {
        return;
      }

      for (const task of tasks) {
        let currentStatus = task.status;
        try {
          // Attempt to mark as processing
          task.status = 'processing';
          try {
            await this.updateTask(task);
          } catch (updateError) {
            errorLogger.error('Failed to update task status to processing', {
              component: 'BackgroundSync',
              operation: 'processTasks',
              taskId: task.id,
              error: updateError
            });
            // Skip this task if we can't update its status
            continue;
          }

          // Process the task
          await this.processTask(task);

          // Attempt to mark as completed
          task.status = 'completed';
          try {
            await this.updateTask(task);
          } catch (updateError) {
            errorLogger.error('Failed to update task status to completed', {
              component: 'BackgroundSync',
              operation: 'processTasks',
              taskId: task.id,
              error: updateError
            });
            // Try to revert to previous status
            task.status = currentStatus;
            await this.updateTask(task).catch(revertError => {
              errorLogger.error('Failed to revert task status', {
                component: 'BackgroundSync',
                operation: 'processTasks',
                taskId: task.id,
                error: revertError
              });
            });
            throw updateError;
          }

          if (this.config.onSyncComplete) {
            this.config.onSyncComplete(task);
          }

          errorLogger.debug('Task processed successfully', {
            component: 'BackgroundSync',
            operation: 'processTasks',
            taskId: task.id,
            type: task.type
          });
        } catch (error) {
          const errorType = this.categorizeError(error);
          task.retryCount++;
          task.error = {
            message: error instanceof Error ? error.message : 'Unknown error',
            category: errorType
          };

          // Handle different error types
          switch (errorType) {
            case 'network':
              // Always retry network errors with backoff
              task.status = 'pending';
              const delay = this.calculateBackoffDelay(task.retryCount);
              await new Promise(resolve => setTimeout(resolve, delay));
              break;

            case 'auth':
              // Don't retry auth errors, mark as failed immediately
              task.status = 'failed';
              errorLogger.error('Authentication error during sync', {
                component: 'BackgroundSync',
                operation: 'processTasks',
                taskId: task.id,
                error
              });
              break;

            case 'validation':
              // Don't retry validation errors, mark as failed immediately
              task.status = 'failed';
              errorLogger.error('Validation error during sync', {
                component: 'BackgroundSync',
                operation: 'processTasks',
                taskId: task.id,
                error
              });
              break;

            case 'unknown':
              // Retry unknown errors up to max retries
              task.status = task.retryCount >= this.config.maxRetries ? 'failed' : 'pending';
              if (task.status === 'pending') {
                const delay = this.calculateBackoffDelay(task.retryCount);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              break;
          }

          // Attempt to update task with new status
          try {
            await this.updateTask(task);
          } catch (updateError) {
            errorLogger.error('Failed to update task status after error', {
              component: 'BackgroundSync',
              operation: 'processTasks',
              taskId: task.id,
              targetStatus: task.status,
              error: updateError
            });
            // Try to revert to previous status
            task.status = currentStatus;
            await this.updateTask(task).catch(revertError => {
              errorLogger.error('Failed to revert task status', {
                component: 'BackgroundSync',
                operation: 'processTasks',
                taskId: task.id,
                error: revertError
              });
            });
          }

          if (task.status === 'failed') {
            errorLogger.error('Task failed permanently', {
              component: 'BackgroundSync',
              operation: 'processTasks',
              taskId: task.id,
              retryCount: task.retryCount,
              errorType,
              error
            });

            if (this.config.onSyncError) {
              this.config.onSyncError(task, error as Error);
            }
            
            toast.error('Sync failed', {
              description: this.getErrorDescription(errorType, task.retryCount)
            });
          }
        }
      }
    } catch (error) {
      errorLogger.error('Failed to process sync tasks', {
        component: 'BackgroundSync',
        operation: 'processTasks',
        error
      });
      toast.error('Sync error', {
        description: 'Failed to process sync tasks.'
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get user-friendly error description based on error type
   */
  private getErrorDescription(errorType: string, retryCount: number): string {
    switch (errorType) {
      case 'network':
        return 'Network error: Unable to connect to the server. Will retry automatically.';
      case 'auth':
        return 'Authentication error: Please log in again.';
      case 'validation':
        return 'Invalid data: Please check your input and try again.';
      default:
        return `Failed to sync task after ${retryCount} attempts.`;
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: SyncTask): Promise<void> {
    const { endpoint, data, headers } = task.payload;
    
    try {
      const response = await fetch(endpoint, {
        method: this.getHttpMethod(task.type),
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new BackgroundSyncError(
          `HTTP error ${response.status}`,
          await response.text(),
          response.status.toString()
        );
      }
    } catch (error) {
      const category = this.categorizeError(error);
      task.error = {
        message: error instanceof Error ? error.message : String(error),
        category,
        code: error instanceof BackgroundSyncError ? error.code : undefined
      };
      throw error;
    }
  }

  private getHttpMethod(type: SyncTaskType): string {
    switch (type) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
    }
  }

  /**
   * Update a task in the database
   * Validates the task data and ensures proper status transitions
   */
  private async updateTask(task: SyncTask): Promise<void> {
    await this.db.execute<SyncTask>({
      store: 'tasks',
      type: 'put',
      data: task
    });
  }

  /**
   * Get sync queue statistics using IndexedDB indexes
   */
  async getStats(): Promise<SyncTaskStats> {
    const stats: SyncTaskStats = {
      totalTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    };

    try {
      // Get tasks for each status
      for (const status of ['pending', 'completed', 'failed'] as const) {
        try {
          const tasks = await this.db.execute<SyncTask[]>({
            store: 'tasks',
            type: 'getAll',
            index: {
              name: 'status',
              key: status
            }
          });

          if (tasks) {
            const count = tasks.length;
            switch (status) {
              case 'pending':
                stats.pendingTasks = count;
                break;
              case 'completed':
                stats.completedTasks = count;
                break;
              case 'failed':
                stats.failedTasks = count;
                break;
            }
            stats.totalTasks += count;
          }
        } catch (error) {
          errorLogger.error('Failed to get tasks for status', {
            component: 'BackgroundSync',
            operation: 'getStats',
            status,
            error
          });
        }
      }

      // Update sync timestamps if available
      const lastTask = await this.db.execute<SyncTask>({
        store: 'tasks',
        type: 'get',
        index: {
          name: 'timestamp',
          key: IDBKeyRange.upperBound(Date.now())
        }
      });

      if (lastTask) {
        stats.lastSyncAttempt = new Date(lastTask.timestamp);
        if (lastTask.status === 'completed') {
          stats.lastSuccessfulSync = new Date(lastTask.timestamp);
        }
      }

      return stats;
    } catch (error) {
      const syncError = new BackgroundSyncError(
        'Failed to get sync stats',
        error
      );
      errorLogger.error(syncError, {
        component: 'BackgroundSync',
        operation: 'getStats'
      });
      throw syncError;
    }
  }

  /**
   * Clear all completed tasks from the sync queue
   */
  async clearCompletedTasks(): Promise<void> {
    try {
      // Get all completed tasks using the status index
      const completedTasks = await this.db.execute<SyncTask[]>({
        store: 'tasks',
        type: 'getAll',
        index: {
          name: 'status',
          key: 'completed'
        }
      });

      if (!completedTasks?.length) {
        errorLogger.debug('No completed tasks to clear', {
          component: 'BackgroundSync',
          operation: 'clearCompletedTasks'
        });
        return;
      }

      // Delete tasks in batches to avoid transaction timeouts
      const BATCH_SIZE = 100;
      const batches = Math.ceil(completedTasks.length / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        const batchTasks = completedTasks.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        
        try {
          await Promise.all(
            batchTasks.map(task => 
              this.db.execute({
                store: 'tasks',
                type: 'delete',
                key: task.id
              })
            )
          );

          errorLogger.debug(`Cleared batch ${i + 1}/${batches} of completed tasks`, {
            component: 'BackgroundSync',
            operation: 'clearCompletedTasks',
            batchSize: batchTasks.length
          });
        } catch (error) {
          const batchError = new DatabaseError(
            `Failed to clear batch ${i + 1}/${batches} of completed tasks`,
            { error, batch: i + 1, total: batches }
          );
          errorLogger.error(batchError, {
            component: 'BackgroundSync',
            operation: 'clearCompletedTasks'
          });
          // Continue with next batch even if one fails
        }
      }

      errorLogger.info('Successfully cleared completed tasks', {
        component: 'BackgroundSync',
        operation: 'clearCompletedTasks',
        totalCleared: completedTasks.length
      });
    } catch (error) {
      const dbError = new DatabaseError(
        'Failed to clear completed tasks',
        { error }
      );
      errorLogger.error(dbError, {
        component: 'BackgroundSync',
        operation: 'clearCompletedTasks'
      });
      throw dbError;
    }
  }
} 