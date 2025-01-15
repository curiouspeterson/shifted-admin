import { toast } from '@/components/ui/toast';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface SyncQueueConfig {
  maxRetries?: number;
  retryDelay?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export class SyncQueue {
  private static instance: SyncQueue;
  private queue: SyncOperation[] = [];
  private isProcessing: boolean = false;
  private config: Required<SyncQueueConfig>;

  private constructor(config: SyncQueueConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      onSyncComplete: () => {},
      onSyncError: () => {},
      ...config,
    };

    // Load queue from IndexedDB on initialization
    this.loadQueue();
  }

  static getInstance(config?: SyncQueueConfig): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue(config);
    }
    return SyncQueue.instance;
  }

  private async loadQueue(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction('syncQueue', 'readonly');
      const store = transaction.objectStore('syncQueue');
      const operations = await store.getAll();
      this.queue = operations;
      this.notifyPendingChanges();
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      await store.clear();
      for (const operation of this.queue) {
        await store.add(operation);
      }
      this.notifyPendingChanges();
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('syncQueueDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
    });
  }

  private notifyPendingChanges(): void {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'pending-changes',
        count: this.queue.length,
      });
    }
  }

  async add(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const newOperation: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(newOperation);
    await this.saveQueue();

    if (!this.isProcessing && navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    navigator.serviceWorker?.controller?.postMessage({ type: 'sync-started' });

    try {
      const operations = [...this.queue];
      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          this.queue = this.queue.filter(op => op.id !== operation.id);
          await this.saveQueue();
        } catch (error) {
          if (operation.retryCount < this.config.maxRetries) {
            operation.retryCount++;
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          } else {
            this.queue = this.queue.filter(op => op.id !== operation.id);
            await this.saveQueue();
            toast({
              title: 'Sync Failed',
              description: `Failed to sync operation after ${this.config.maxRetries} attempts.`,
              variant: 'destructive',
            });
          }
        }
      }

      if (this.queue.length === 0) {
        navigator.serviceWorker?.controller?.postMessage({ type: 'sync-completed' });
        this.config.onSyncComplete();
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.config.onSyncError(error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const { endpoint, type, payload } = operation;

    const response = await fetch(endpoint, {
      method: type === 'delete' ? 'DELETE' : type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'delete' ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Failed to process operation: ${response.statusText}`);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.saveQueue();
  }
} 