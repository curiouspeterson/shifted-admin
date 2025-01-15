import { toast } from 'sonner';
import { errorLogger, ErrorSeverity } from '@/lib/logging/error-logger';
import { DatabaseError } from '@/lib/errors/base';

export interface DBConfig {
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
      const dbError = new DatabaseError(
        'Failed to initialize IndexedDB',
        { error, dbName: this.config.name }
      );
      errorLogger.error(dbError, {
        component: 'IndexedDB',
        operation: 'init',
        dbName: this.config.name,
        version: this.config.version
      });
      toast.error('Failed to initialize offline storage', {
        description: 'Please try again or contact support if the issue persists.',
      });
      throw dbError;
    }
  }

  /**
   * Open the database connection
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        const error = new DatabaseError(
          'Failed to open IndexedDB connection',
          { error: request.error, dbName: this.config.name }
        );
        errorLogger.error(error, {
          component: 'IndexedDB',
          operation: 'openDatabase',
          dbName: this.config.name,
          version: this.config.version
        });
        reject(error);
      };

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        
        if (!transaction) {
          const error = new DatabaseError(
            'Failed to get transaction during database upgrade',
            { dbName: this.config.name, version: this.config.version }
          );
          errorLogger.error(error, {
            component: 'IndexedDB',
            operation: 'onupgradeneeded',
            dbName: this.config.name,
            version: this.config.version
          });
          throw error;
        }

        try {
          // Create or update object stores
          for (const [storeName, storeConfig] of Object.entries(this.config.stores)) {
            let store: IDBObjectStore;
            
            if (!db.objectStoreNames.contains(storeName)) {
              store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
            } else {
              store = transaction.objectStore(storeName);
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
        } catch (error) {
          const dbError = new DatabaseError(
            'Failed to upgrade database schema',
            { error, dbName: this.config.name, version: this.config.version }
          );
          errorLogger.error(dbError, {
            component: 'IndexedDB',
            operation: 'onupgradeneeded',
            dbName: this.config.name,
            version: this.config.version
          });
          throw dbError;
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

      try {
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
            const error = new DatabaseError(
              `Unsupported operation type: ${operation.type}`,
              { operation }
            );
            errorLogger.error(error, {
              component: 'IndexedDB',
              operation: 'execute',
              dbName: this.config.name,
              operationType: operation.type
            });
            reject(error);
            return;
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          const error = new DatabaseError(
            `Failed to execute ${operation.type} operation`,
            { error: request.error, operation }
          );
          errorLogger.error(error, {
            component: 'IndexedDB',
            operation: 'execute',
            dbName: this.config.name,
            operationType: operation.type,
            store: operation.store
          });
          reject(error);
        };
      } catch (error) {
        const dbError = new DatabaseError(
          `Unexpected error during ${operation.type} operation`,
          { error, operation }
        );
        errorLogger.error(dbError, {
          component: 'IndexedDB',
          operation: 'execute',
          dbName: this.config.name,
          operationType: operation.type,
          store: operation.store
        });
        reject(dbError);
      }
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
      try {
        this.db.close();
        errorLogger.info('Database connection closed', {
          component: 'IndexedDB',
          operation: 'close',
          dbName: this.config.name
        });
        this.db = null;
      } catch (error) {
        const dbError = new DatabaseError(
          'Failed to close database connection',
          { error, dbName: this.config.name }
        );
        errorLogger.error(dbError, {
          component: 'IndexedDB',
          operation: 'close',
          dbName: this.config.name
        });
        throw dbError;
      }
    }
  }

  /**
   * Delete the database
   */
  static async deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => {
        errorLogger.info('Database deleted successfully', {
          component: 'IndexedDB',
          operation: 'deleteDatabase',
          dbName: name
        });
        resolve();
      };
      request.onerror = () => {
        const error = new DatabaseError(
          'Failed to delete database',
          { error: request.error, dbName: name }
        );
        errorLogger.error(error, {
          component: 'IndexedDB',
          operation: 'deleteDatabase',
          dbName: name
        });
        reject(error);
      };
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

    try {
      const stats: { [key: string]: { count: number; size: number } } = {};
      let totalSize = 0;

      const storeNames = Array.from(this.db!.objectStoreNames);
      for (const storeName of storeNames) {
        try {
          const count = await this.execute({
            store: storeName,
            type: 'getAll',
          }) as any[];

          const size = new Blob([JSON.stringify(count)]).size;
          stats[storeName] = { count: count.length, size };
          totalSize += size;
        } catch (error) {
          errorLogger.warn(
            new DatabaseError(
              `Failed to get stats for store: ${storeName}`,
              { error, storeName }
            ),
            {
              component: 'IndexedDB',
              operation: 'getStats',
              dbName: this.config.name,
              store: storeName
            }
          );
          // Continue with other stores even if one fails
          stats[storeName] = { count: 0, size: 0 };
        }
      }

      const result = {
        stores: stats,
        totalSize: Math.round(totalSize / 1024), // Size in KB
      };

      errorLogger.info('Database stats collected', {
        component: 'IndexedDB',
        operation: 'getStats',
        dbName: this.config.name,
        stats: result
      });

      return result;
    } catch (error) {
      const dbError = new DatabaseError(
        'Failed to collect database stats',
        { error, dbName: this.config.name }
      );
      errorLogger.error(dbError, {
        component: 'IndexedDB',
        operation: 'getStats',
        dbName: this.config.name
      });
      throw dbError;
    }
  }
} 