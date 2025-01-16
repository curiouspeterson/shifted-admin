import { toast } from 'sonner';
import { errorLogger } from '@/lib/logging/error-logger';
import { DatabaseError } from '@/lib/errors/base';

export interface DBConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      indexes?: {
        name: string;
        keyPath: string | string[];
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

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  details?: unknown;
  cause?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Extended IDBTransaction interface for upgrade handling
 */
interface UpgradeTransaction extends IDBTransaction {
  error: DOMException | null;
  oncomplete: ((this: IDBTransaction, ev: Event) => void) | null;
  onerror: ((this: IDBTransaction, ev: Event) => void) | null;
}

/**
 * Format error for logging
 */
function formatError(error: unknown): ErrorDetails {
  if (error instanceof DatabaseError) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details
    };
  }
  if (error instanceof DOMException) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: String(error.code)
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    };
  }
  return {
    name: 'UnknownError',
    message: String(error)
  };
}

/**
 * IndexedDB Utility Class
 * Last Updated: 2024-01-15
 * 
 * Provides a type-safe wrapper around IndexedDB with proper error handling
 * and transaction management for offline-first PWA functionality.
 */

/**
 * Utility class for handling IndexedDB operations with proper error handling
 * and transaction management.
 */
export class IndexedDB {
  private static instances: Map<string, IndexedDB> = new Map();
  private db: IDBDatabase | null = null;
  private config: DBConfig;
  private upgradeInProgress: boolean = false;

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
      const errorDetails = formatError(error);
      errorLogger.error('Failed to initialize IndexedDB', {
        component: 'IndexedDB',
        operation: 'init',
        dbName: this.config.name,
        version: this.config.version,
        error: errorDetails
      });
      toast.error('Failed to initialize offline storage', {
        description: 'Please try again or contact support if the issue persists.',
      });
      throw error;
    }
  }

  /**
   * Open the database connection with proper transaction handling
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);
      let upgradeTransaction: UpgradeTransaction | null = null;
      const UPGRADE_TIMEOUT = 5000; // 5 seconds
      let upgradeTimer: NodeJS.Timeout | null = null;

      request.onerror = () => {
        const error = new DatabaseError(
          'Failed to open IndexedDB connection',
          { error: request.error, dbName: this.config.name, version: this.config.version }
        );
        errorLogger.error('Failed to open IndexedDB connection', {
          component: 'IndexedDB',
          operation: 'openDatabase',
          dbName: this.config.name,
          version: this.config.version,
          error: formatError(error)
        });
        reject(error);
      };

      request.onsuccess = () => {
        const db = request.result;
        
        // Handle version change events
        db.onversionchange = () => {
          db.close();
          this.db = null;
          toast.error('Database was updated in another tab', {
            description: 'Please refresh the page to continue.',
          });
        };

        resolve(db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        if (this.upgradeInProgress) {
          return;
        }

        this.upgradeInProgress = true;
        const db = request.result;
        
        // Get the transaction from the event
        upgradeTransaction = request.transaction as UpgradeTransaction;
        if (!upgradeTransaction) {
          const error = new DatabaseError(
            'No transaction available for database upgrade',
            { dbName: this.config.name, version: this.config.version }
          );
          errorLogger.error('No transaction available for database upgrade', {
            component: 'IndexedDB',
            operation: 'onupgradeneeded',
            error: formatError(error)
          });
          this.upgradeInProgress = false;
          reject(error);
          return;
        }

        // Set up upgrade timeout
        upgradeTimer = setTimeout(() => {
          if (this.upgradeInProgress) {
            const error = new DatabaseError(
              'Database upgrade timed out',
              { dbName: this.config.name, version: this.config.version }
            );
            errorLogger.error('Database upgrade timed out', {
              component: 'IndexedDB',
              operation: 'onupgradeneeded',
              error: formatError(error)
            });
            this.upgradeInProgress = false;
            reject(error);
          }
        }, UPGRADE_TIMEOUT);

        // Handle transaction errors
        upgradeTransaction.onerror = () => {
          const txError = upgradeTransaction?.error;
          const error = new DatabaseError(
            'Transaction failed during database upgrade',
            { 
              error: txError,
              dbName: this.config.name,
              version: this.config.version
            }
          );
          errorLogger.error('Transaction failed during database upgrade', {
            component: 'IndexedDB',
            operation: 'onupgradeneeded',
            error: formatError(error)
          });
          this.upgradeInProgress = false;
          if (upgradeTimer) clearTimeout(upgradeTimer);
          reject(error);
        };

        // Handle transaction completion
        upgradeTransaction.oncomplete = () => {
          this.upgradeInProgress = false;
          if (upgradeTimer) clearTimeout(upgradeTimer);
        };
        
        try {
          // Create or update object stores
          for (const [storeName, storeConfig] of Object.entries(this.config.stores)) {
            let store: IDBObjectStore;
            
            // Create or get the store
            if (!db.objectStoreNames.contains(storeName)) {
              store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
            } else {
              // Get existing store from the upgrade transaction
              store = upgradeTransaction.objectStore(storeName);
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
          errorLogger.error('Failed to upgrade database schema', {
            component: 'IndexedDB',
            operation: 'onupgradeneeded',
            error: formatError(dbError)
          });
          this.upgradeInProgress = false;
          if (upgradeTimer) clearTimeout(upgradeTimer);
          reject(dbError);
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
            errorLogger.error(`Unsupported operation type: ${operation.type}`, {
              component: 'IndexedDB',
              operation: 'execute',
              dbName: this.config.name,
              operationType: operation.type,
              error: formatError(error)
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
          errorLogger.error(`Failed to execute ${operation.type} operation`, {
            component: 'IndexedDB',
            operation: 'execute',
            dbName: this.config.name,
            operationType: operation.type,
            store: operation.store,
            error: formatError(error)
          });
          reject(error);
        };
      } catch (error) {
        const dbError = new DatabaseError(
          `Unexpected error during ${operation.type} operation`,
          { error, operation }
        );
        errorLogger.error(`Unexpected error during ${operation.type} operation`, {
          component: 'IndexedDB',
          operation: 'execute',
          dbName: this.config.name,
          operationType: operation.type,
          store: operation.store,
          error: formatError(dbError)
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
        errorLogger.error('Failed to close database connection', {
          component: 'IndexedDB',
          operation: 'close',
          dbName: this.config.name,
          error: formatError(dbError)
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
        errorLogger.error('Failed to delete database', {
          component: 'IndexedDB',
          operation: 'deleteDatabase',
          dbName: name,
          error: formatError(error)
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
          const dbError = new DatabaseError(
            `Failed to get stats for store: ${storeName}`,
            { error, storeName }
          );
          errorLogger.warn(`Failed to get stats for store: ${storeName}`, {
            component: 'IndexedDB',
            operation: 'getStats',
            dbName: this.config.name,
            store: storeName,
            error: formatError(dbError)
          });
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
      errorLogger.error('Failed to collect database stats', {
        component: 'IndexedDB',
        operation: 'getStats',
        dbName: this.config.name,
        error: formatError(dbError)
      });
      throw dbError;
    }
  }
} 