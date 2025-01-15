import { toast } from '@/components/ui/toast';

interface DBConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      indexes?: {
        name: string;
        keyPath: string;
        options?: IDBIndexParameters;
      }[];
    };
  };
}

interface DBOperation<T> {
  store: string;
  type: 'add' | 'put' | 'delete' | 'get' | 'getAll' | 'clear';
  key?: IDBValidKey;
  data?: T;
  index?: {
    name: string;
    key: IDBValidKey | IDBKeyRange;
  };
}

/**
 * Utility class for handling IndexedDB operations
 */
export class IndexedDB {
  private static instances: Map<string, IndexedDB> = new Map();
  private db: IDBDatabase | null = null;
  private config: DBConfig;

  private constructor(config: DBConfig) {
    this.config = config;
  }

  static getInstance(config: DBConfig): IndexedDB {
    if (!IndexedDB.instances.has(config.name)) {
      IndexedDB.instances.set(config.name, new IndexedDB(config));
    }
    return IndexedDB.instances.get(config.name)!;
  }

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await this.openDatabase();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      toast({
        title: 'Database Error',
        description: 'Failed to initialize offline storage.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Open the database connection
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create or update object stores
        for (const [storeName, storeConfig] of Object.entries(this.config.stores)) {
          let store: IDBObjectStore;
          
          if (!db.objectStoreNames.contains(storeName)) {
            store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
          } else {
            store = request.transaction!.objectStore(storeName);
          }

          // Create or update indexes
          if (storeConfig.indexes) {
            for (const index of storeConfig.indexes) {
              if (!store.indexNames.contains(index.name)) {
                store.createIndex(index.name, index.keyPath, index.options);
              }
            }
          }
        }
      };
    });
  }

  /**
   * Execute a database operation
   */
  async execute<T, R = T>(operation: DBOperation<T>): Promise<R | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(operation.store, this.getTransactionMode(operation.type));
      const store = transaction.objectStore(operation.store);

      let request: IDBRequest;

      switch (operation.type) {
        case 'add':
          request = store.add(operation.data!);
          break;
        case 'put':
          request = store.put(operation.data!);
          break;
        case 'delete':
          request = store.delete(operation.key!);
          break;
        case 'get':
          if (operation.index) {
            const index = store.index(operation.index.name);
            request = index.get(operation.index.key);
          } else {
            request = store.get(operation.key!);
          }
          break;
        case 'getAll':
          if (operation.index) {
            const index = store.index(operation.index.name);
            request = index.getAll(operation.index.key);
          } else {
            request = store.getAll();
          }
          break;
        case 'clear':
          request = store.clear();
          break;
        default:
          reject(new Error(`Unsupported operation type: ${operation.type}`));
          return;
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get the appropriate transaction mode for an operation
   */
  private getTransactionMode(type: DBOperation<any>['type']): IDBTransactionMode {
    return ['add', 'put', 'delete', 'clear'].includes(type) ? 'readwrite' : 'readonly';
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete the database
   */
  static async deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    stores: { [key: string]: { count: number; size: number } };
    totalSize: number;
  }> {
    if (!this.db) {
      await this.init();
    }

    const stats: { [key: string]: { count: number; size: number } } = {};
    let totalSize = 0;

    for (const storeName of this.db!.objectStoreNames) {
      const count = await this.execute({
        store: storeName,
        type: 'getAll',
      }) as any[];

      const size = new Blob([JSON.stringify(count)]).size;
      stats[storeName] = { count: count.length, size };
      totalSize += size;
    }

    return {
      stores: stats,
      totalSize: Math.round(totalSize / 1024), // Size in KB
    };
  }
} 