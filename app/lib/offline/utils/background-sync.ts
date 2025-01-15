import { toast } from '@/components/ui/toast';
import { IndexedDB } from './indexed-db';

interface SyncTask {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

interface BackgroundSyncConfig {
  maxRetries?: number;
  retryDelay?: number;
  onSyncComplete?: (task: SyncTask) => void;
  onSyncError?: (task: SyncTask, error: Error) => void;
}

/**
 * Utility class for handling background sync operations
 */
export class BackgroundSync {
  private static instance: BackgroundSync;
  private db: IndexedDB;
  private isProcessing: boolean = false;
  private config: Required<BackgroundSyncConfig>;

  private constructor(config: BackgroundSyncConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      onSyncComplete: () => {},
      onSyncError: () => {},
      ...config,
    };

    this.db = IndexedDB.getInstance({
      name: 'background-sync',
      version: 1,
      stores: {
        tasks: {
          keyPath: 'id',
          indexes: [
            { name: 'status', keyPath: 'status' },
            { name: 'timestamp', keyPath: 'timestamp' },
          ],
        },
      },
    });

    // Initialize database connection
    this.db.init().catch(error => {
      console.error('Failed to initialize background sync database:', error);
    });

    // Register service worker sync event
    this.registerSync();
  }

  static getInstance(config?: BackgroundSyncConfig): BackgroundSync {
    if (!BackgroundSync.instance) {
      BackgroundSync.instance = new BackgroundSync(config);
    }
    return BackgroundSync.instance;
  }

  private async registerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  /**
   * Add a task to the sync queue
   */
  async addTask(type: string, payload: any): Promise<void> {
    const task: SyncTask = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      await this.db.execute({
        store: 'tasks',
        type: 'add',
        data: task,
      });

      toast({
        title: 'Task Queued',
        description: 'Your changes will be synchronized in the background.',
        variant: 'default',
      });

      if (!this.isProcessing) {
        this.processTasks();
      }
    } catch (error) {
      console.error('Failed to add sync task:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to queue your changes for synchronization.',
        variant: 'destructive',
      });
    }
  }

  /**
   * Process pending tasks
   */
  async processTasks(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const tasks = await this.db.execute<SyncTask[]>({
        store: 'tasks',
        type: 'getAll',
        index: {
          name: 'status',
          key: 'pending',
        },
      });

      if (!tasks || tasks.length === 0) {
        return;
      }

      for (const task of tasks) {
        try {
          task.status = 'processing';
          await this.updateTask(task);

          await this.processTask(task);

          task.status = 'completed';
          await this.updateTask(task);

          this.config.onSyncComplete(task);
        } catch (error) {
          console.error(`Failed to process task ${task.id}:`, error);

          if (task.retryCount < this.config.maxRetries) {
            task.retryCount++;
            task.status = 'pending';
            task.error = (error as Error).message;
            await this.updateTask(task);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          } else {
            task.status = 'failed';
            task.error = (error as Error).message;
            await this.updateTask(task);

            this.config.onSyncError(task, error as Error);
            
            toast({
              title: 'Sync Failed',
              description: `Failed to sync task after ${this.config.maxRetries} attempts.`,
              variant: 'destructive',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to process sync tasks:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: SyncTask): Promise<void> {
    // Implementation will vary based on task type
    switch (task.type) {
      case 'create':
      case 'update':
      case 'delete':
        await this.processApiTask(task);
        break;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  /**
   * Process an API task
   */
  private async processApiTask(task: SyncTask): Promise<void> {
    const response = await fetch(task.payload.endpoint, {
      method: task.type === 'delete' ? 'DELETE' : task.type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: task.type !== 'delete' ? JSON.stringify(task.payload.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
  }

  /**
   * Update a task in the database
   */
  private async updateTask(task: SyncTask): Promise<void> {
    await this.db.execute({
      store: 'tasks',
      type: 'put',
      data: task,
    });
  }

  /**
   * Get sync queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const tasks = await this.db.execute<SyncTask[]>({
      store: 'tasks',
      type: 'getAll',
    });

    if (!tasks) {
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    return tasks.reduce((stats, task) => {
      stats[task.status]++;
      return stats;
    }, {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    });
  }

  /**
   * Clear completed tasks
   */
  async clearCompletedTasks(): Promise<void> {
    const tasks = await this.db.execute<SyncTask[]>({
      store: 'tasks',
      type: 'getAll',
      index: {
        name: 'status',
        key: 'completed',
      },
    });

    if (!tasks) return;

    for (const task of tasks) {
      await this.db.execute({
        store: 'tasks',
        type: 'delete',
        key: task.id,
      });
    }
  }
} 