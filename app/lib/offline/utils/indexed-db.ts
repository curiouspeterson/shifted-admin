/**
 * IndexedDB Utilities
 * Last Updated: 2025-01-17
 * 
 * Utilities for working with IndexedDB in offline mode.
 */

import { DatabaseError } from '@/lib/errors';
import { toast } from 'sonner';
import { z } from 'zod';
import { errorLogger } from '@/lib/logging/error-logger';

/**
 * IndexedDB Utility Class
 * Last Updated: January 16, 2025
 * 
 * Provides a type-safe wrapper around IndexedDB with proper error handling,
 * data validation using Zod, and transaction management for offline-first PWA functionality.
 */

// Base schema for metadata
const metadataSchema = z.object({
  timestamp: z.number(),
  version: z.number().optional(),
});

// Schema for database configuration
const dbConfigSchema = z.object({
  name: z.string(),
  version: z.number(),
  stores: z.record(z.object({
    keyPath: z.string(),
    indexes: z.array(z.object({
      name: z.string(),
      keyPath: z.union([z.string(), z.array(z.string())]),
      options: z.object({
        unique: z.boolean().optional(),
        multiEntry: z.boolean().optional(),
      }).optional(),
    })).optional(),
  })),
});

// Type inference from schemas
export type DBConfig = z.infer<typeof dbConfigSchema>;
export type Metadata = z.infer<typeof metadataSchema>;

/**
 * Generic type for store items
 */
export type StoreItem<T> = T & Metadata & {
  id: string;
};

/**
 * Operation definitions with precise types
 */
export const DB_OPERATIONS = {
  add: 'add',
  put: 'put',
  get: 'get',
  getAll: 'getAll',
  delete: 'delete',
  clear: 'clear',
  count: 'count'
} as const;

/**
 * Operation type literals
 */
export type DBOperationType = typeof DB_OPERATIONS[keyof typeof DB_OPERATIONS];

/**
 * Operation result mapping with precise types
 */
type OperationResultMap<T> = {
  [DB_OPERATIONS.add]: StoreItem<T>;
  [DB_OPERATIONS.put]: StoreItem<T>;
  [DB_OPERATIONS.get]: StoreItem<T> | null;
  [DB_OPERATIONS.getAll]: StoreItem<T>[];
  [DB_OPERATIONS.delete]: void;
  [DB_OPERATIONS.clear]: void;
  [DB_OPERATIONS.count]: number;
};

/**
 * Database operation with discriminated union
 */
type DBOperationBase<T> = {
  store: string;
  schema?: z.ZodType<T>;
  mode?: IDBTransactionMode;
};

type AddOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.add;
  value: T;
};

type PutOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.put;
  value: T;
};

type GetOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.get;
  key: IDBValidKey;
};

type GetAllOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.getAll;
};

type DeleteOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.delete;
  key: IDBValidKey;
};

type ClearOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.clear;
};

type CountOperation<T> = DBOperationBase<T> & {
  type: typeof DB_OPERATIONS.count;
};

export type DBOperation<T> =
  | AddOperation<T>
  | PutOperation<T>
  | GetOperation<T>
  | GetAllOperation<T>
  | DeleteOperation<T>
  | ClearOperation<T>
  | CountOperation<T>;

/**
 * Operation result type with discriminated union
 */
export type DBOperationResult<T, K extends DBOperationType = DBOperationType> = {
  type: K;
  value: OperationResultMap<T>[K];
};

/**
 * Type guard for operation types
 */
function isOperationType<K extends DBOperationType>(
  type: DBOperationType,
  expected: K
): type is K {
  return type === expected;
}

/**
 * Utility to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Error details type for consistent error formatting
 */
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
  operation?: {
    type: string;
    store: string;
    timestamp: string;
  };
  transaction?: {
    mode: IDBTransactionMode;
    stores: string[];
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
 * Format error for logging with enhanced details
 */
function formatError(error: unknown, operation?: DBOperation<unknown>): ErrorDetails {
  const baseError = {
    name: 'UnknownError',
    message: String(error),
    operation: operation ? {
      type: operation.type,
      store: operation.store,
      timestamp: new Date().toISOString()
    } : undefined
  };

  if (error instanceof DatabaseError) {
    return {
      ...baseError,
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details
    };
  }

  if (error instanceof DOMException) {
    return {
      ...baseError,
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: String(error.code)
    };
  }

  if (error instanceof Error) {
    return {
      ...baseError,
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

  return baseError;
}

/**
 * Store configuration with schema
 */
export interface StoreConfig<T> {
  name: string;
  schema: z.ZodType<T>;
  keyPath: string;
  indexes?: Array<{
    name: string;
    keyPath: string | string[];
    options?: IDBIndexParameters;
  }>;
}

/**
 * Type-safe store operations
 */
export class Store<T extends Record<string, unknown>> {
  constructor(
    private readonly db: IndexedDB,
    private readonly config: StoreConfig<T>
  ) {}

  /**
   * Get item by id
   */
  async findById(id: string): Promise<StoreItem<T> | null> {
    const result = await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.get,
      key: id,
      schema: this.config.schema
    } as const);

    return result.value as StoreItem<T> | null;
  }

  /**
   * Get all items
   */
  async getAll(): Promise<StoreItem<T>[]> {
    const result = await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.getAll,
      schema: this.config.schema,
      mode: 'readonly'
    } as const);

    return result.value as StoreItem<T>[];
  }

  /**
   * Create new item
   */
  async create(params: T): Promise<StoreItem<T>> {
    const item = {
      ...params,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      version: 1,
    };

    const result = await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.add,
      value: item,
      schema: this.config.schema,
      mode: 'readwrite'
    } as const);

    if (!result.value) {
      throw new DatabaseError('Failed to create item');
    }

    return result.value as StoreItem<T>;
  }

  /**
   * Update existing item
   */
  async update(id: string, params: Partial<T>): Promise<StoreItem<T>> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new DatabaseError('Item not found');
    }

    const item = {
      ...existing,
      ...params,
      timestamp: Date.now(),
      version: (existing.version ?? 1) + 1,
    };

    const result = await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.put,
      value: item,
      schema: this.config.schema,
      mode: 'readwrite'
    } as const);

    if (!result.value) {
      throw new DatabaseError('Failed to update item');
    }

    return result.value as StoreItem<T>;
  }

  /**
   * Delete item by id
   */
  async delete(id: string): Promise<void> {
    await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.delete,
      key: id,
      mode: 'readwrite'
    } as const);
  }

  /**
   * Aggregate items in store
   */
  async aggregate<R>(
    reducer: (total: R, item: StoreItem<T>) => R,
    initialValue: R
  ): Promise<R> {
    const items = await this.getAll();
    return items.reduce(reducer, initialValue);
  }

  /**
   * Count items in store
   */
  async count(): Promise<number> {
    const result = await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.count,
      mode: 'readonly'
    } as const);

    return result.value as number;
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    await this.db.execute({
      store: this.config.name,
      type: DB_OPERATIONS.clear,
      mode: 'readwrite'
    } as const);
  }

  /**
   * Validate item with schema
   */
  private async validateItem(item: unknown): Promise<StoreItem<T>> {
    try {
      // Validate the data portion with the provided schema
      const validatedData = this.config.schema.parse(item);
      // Validate metadata
      const validatedMetadata = metadataSchema.parse({
        timestamp: (item as any).timestamp,
        version: (item as any).version,
      });
      
      return {
        ...validatedData,
        ...validatedMetadata,
        id: (item as any).id,
      } as StoreItem<T>;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new DatabaseError('Data validation failed', {
          store: this.config.name,
          errors: error.errors,
          data: item,
        });
      }
      throw error;
    }
  }
}

/**
 * Database statistics type
 */
interface DBStats {
  stores: Record<string, number>;
  timestamp: number;
}

/**
 * Utility class for handling IndexedDB operations with proper error handling
 * and transaction management.
 */
export class IndexedDB {
  private static instances: Map<string, IndexedDB> = new Map();
  private db: IDBDatabase | null = null;
  private config: DBConfig;
  private upgradeInProgress: boolean = false;
  private readonly UPGRADE_TIMEOUT = 5000; // 5 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly RETRY_DELAY_MS = 1000;

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
   * Initialize the database connection with retry logic
   */
  async init(): Promise<void> {
    if (this.db) return;

    let attempt = 1;
    while (attempt <= this.MAX_RETRY_ATTEMPTS) {
      try {
        this.db = await this.openDatabase();
        return;
      } catch (error) {
        const errorDetails = formatError(error);
        errorLogger.error(`Failed to initialize IndexedDB (attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS})`, {
          component: 'IndexedDB',
          operation: 'init',
          dbName: this.config.name,
          version: this.config.version,
          error: errorDetails
        });

        if (attempt === this.MAX_RETRY_ATTEMPTS) {
          toast.error('Failed to initialize offline storage', {
            description: 'Please try again or contact support if the issue persists.',
          });
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        attempt++;
      }
    }
  }

  /**
   * Open the database connection with enhanced error handling
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.config.name, this.config.version);
        let db: IDBDatabase;
        let upgradeTransaction: UpgradeTransaction | null = null;
        let upgradeTimeout: NodeJS.Timeout;

        const cleanup = () => {
          if (upgradeTimeout) clearTimeout(upgradeTimeout);
          this.upgradeInProgress = false;
        };

        // Handle connection errors
        request.onerror = () => {
          cleanup();
          const error = new DatabaseError(
            'Failed to open database connection',
            { 
              error: request.error,
              dbName: this.config.name,
              version: this.config.version
            }
          );
          errorLogger.error('Failed to open database connection', {
            component: 'IndexedDB',
            operation: 'openDatabase',
            error: formatError(error)
          });
          reject(error);
        };

        // Handle successful connection
        request.onsuccess = () => {
          if (this.upgradeInProgress) {
            cleanup();
            const error = new DatabaseError(
              'Database connection succeeded but upgrade is still in progress',
              { 
                dbName: this.config.name,
                version: this.config.version
              }
            );
            errorLogger.error('Unexpected database state', {
              component: 'IndexedDB',
              operation: 'openDatabase',
              error: formatError(error)
            });
            reject(error);
            return;
          }

          db = request.result;

          // Handle connection close
          db.onclose = () => {
            this.db = null;
            errorLogger.info('Database connection closed', {
              component: 'IndexedDB',
              operation: 'onclose',
              dbName: this.config.name
            });
          };

          // Handle version change
          db.onversionchange = () => {
            if (db) {
              db.close();
              this.db = null;
              toast.warning('Database was updated in another tab', {
                description: 'Please refresh the page to ensure data consistency.',
              });
            }
          };

          resolve(db);
        };

        // Handle database upgrade
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          try {
            this.upgradeInProgress = true;
            upgradeTimeout = setTimeout(() => {
              if (this.upgradeInProgress) {
                cleanup();
                const error = new DatabaseError(
                  'Database upgrade timed out',
                  { 
                    dbName: this.config.name,
                    version: this.config.version,
                    timeout: this.UPGRADE_TIMEOUT
                  }
                );
                errorLogger.error('Database upgrade timed out', {
                  component: 'IndexedDB',
                  operation: 'onupgradeneeded',
                  error: formatError(error)
                });
                reject(error);
              }
            }, this.UPGRADE_TIMEOUT);

            db = request.result;
            upgradeTransaction = request.transaction as UpgradeTransaction;

            // Create or update object stores
            for (const [storeName, storeConfig] of Object.entries(this.config.stores)) {
              let store: IDBObjectStore;
              
              // Create store if it doesn't exist
              if (!db.objectStoreNames.contains(storeName)) {
                store = db.createObjectStore(storeName, {
                  keyPath: storeConfig.keyPath
                });
                errorLogger.info(`Created object store: ${storeName}`, {
                  component: 'IndexedDB',
                  operation: 'onupgradeneeded',
                  store: storeName
                });
              } else {
                store = upgradeTransaction.objectStore(storeName);
              }

              // Create or update indexes
              if (storeConfig.indexes) {
                const existingIndexNames = Array.from(store.indexNames);
                
                // Remove old indexes
                for (const indexName of existingIndexNames) {
                  if (!storeConfig.indexes.some(index => index.name === indexName)) {
                    store.deleteIndex(indexName);
                    errorLogger.info(`Removed index: ${indexName} from store: ${storeName}`, {
                      component: 'IndexedDB',
                      operation: 'onupgradeneeded',
                      store: storeName,
                      index: indexName
                    });
                  }
                }

                // Create new indexes
                for (const index of storeConfig.indexes) {
                  if (!store.indexNames.contains(index.name)) {
                    store.createIndex(index.name, index.keyPath, index.options);
                    errorLogger.info(`Created index: ${index.name} in store: ${storeName}`, {
                      component: 'IndexedDB',
                      operation: 'onupgradeneeded',
                      store: storeName,
                      index: index.name
                    });
                  }
                }
              }
            }

            // Remove old stores
            for (const storeName of Array.from(db.objectStoreNames)) {
              if (!this.config.stores[storeName]) {
                db.deleteObjectStore(storeName);
                errorLogger.info(`Removed object store: ${storeName}`, {
                  component: 'IndexedDB',
                  operation: 'onupgradeneeded',
                  store: storeName
                });
              }
            }

            // Handle transaction errors
            upgradeTransaction.onerror = () => {
              cleanup();
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
              reject(error);
            };

            // Handle transaction completion
            upgradeTransaction.oncomplete = () => {
              cleanup();
              resolve(db);
            };
          } catch (error) {
            cleanup();
            const formattedError = formatError(error);
            errorLogger.error('Failed to upgrade database', {
              component: 'IndexedDB',
              operation: 'onupgradeneeded',
              error: formattedError
            });
            reject(error);
          }
        };
      } catch (error) {
        const formattedError = formatError(error);
        errorLogger.error('Failed to open database', {
          component: 'IndexedDB',
          operation: 'openDatabase',
          error: formattedError
        });
        reject(new DatabaseError('Failed to open database', formattedError));
      }
    });
  }

  private isAddOperation<T>(op: DBOperation<T>): op is AddOperation<T> {
    return op.type === DB_OPERATIONS.add;
  }

  private isPutOperation<T>(op: DBOperation<T>): op is PutOperation<T> {
    return op.type === DB_OPERATIONS.put;
  }

  private isGetOperation<T>(op: DBOperation<T>): op is GetOperation<T> {
    return op.type === DB_OPERATIONS.get;
  }

  private isGetAllOperation<T>(op: DBOperation<T>): op is GetAllOperation<T> {
    return op.type === DB_OPERATIONS.getAll;
  }

  private isDeleteOperation<T>(op: DBOperation<T>): op is DeleteOperation<T> {
    return op.type === DB_OPERATIONS.delete;
  }

  private isClearOperation<T>(op: DBOperation<T>): op is ClearOperation<T> {
    return op.type === DB_OPERATIONS.clear;
  }

  private isCountOperation<T>(op: DBOperation<T>): op is CountOperation<T> {
    return op.type === DB_OPERATIONS.count;
  }

  async execute<T extends Record<string, unknown>>(
    operation: DBOperation<T>
  ): Promise<DBOperationResult<T, typeof operation.type>> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    let attempt = 1;
    while (attempt <= this.MAX_RETRY_ATTEMPTS) {
      try {
        return await this.executeOperation(operation);
      } catch (error) {
        const errorDetails = formatError(error, operation);
        
        if (attempt === this.MAX_RETRY_ATTEMPTS) {
          throw new DatabaseError('Operation failed after max retries', {
            ...errorDetails,
            value: 'value' in operation ? operation.value : undefined
          });
        }
        
        attempt++;
        await delay(this.RETRY_DELAY_MS);
      }
    }

    throw new DatabaseError('Operation failed after max retries');
  }

  private async executeOperation<T extends Record<string, unknown>>(
    operation: DBOperation<T>
  ): Promise<DBOperationResult<T, typeof operation.type>> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction([operation.store], operation.mode || 'readonly');
        const store = tx.objectStore(operation.store);

        let request: IDBRequest;
        
        if (this.isGetAllOperation(operation)) {
          request = store.getAll();
        } else if (this.isGetOperation(operation)) {
          request = store.get(operation.key);
        } else if (this.isAddOperation(operation)) {
          request = store.add(operation.value);
        } else if (this.isPutOperation(operation)) {
          request = store.put(operation.value);
        } else if (this.isDeleteOperation(operation)) {
          request = store.delete(operation.key);
        } else if (this.isClearOperation(operation)) {
          request = store.clear();
        } else if (this.isCountOperation(operation)) {
          request = store.count();
        } else {
          throw new DatabaseError('Invalid operation type');
        }

        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          try {
            const result = request.result;

            if (this.isCountOperation(operation)) {
              return resolve({
                type: operation.type,
                value: result as number
              });
            }

            if (this.isClearOperation(operation) || this.isDeleteOperation(operation)) {
              return resolve({
                type: operation.type,
                value: undefined as void
              });
            }

            if (this.isGetAllOperation(operation)) {
              const value = operation.schema
                ? (result as any[]).map(item => ({
                    ...operation.schema!.parse(item),
                    ...metadataSchema.parse({
                      timestamp: item.timestamp,
                      version: item.version,
                    }),
                    id: item.id,
                  }))
                : result;

              return resolve({
                type: operation.type,
                value: value as StoreItem<T>[]
              });
            }

            if (this.isGetOperation(operation) || this.isAddOperation(operation) || this.isPutOperation(operation)) {
              if (!result) {
                return resolve({
                  type: operation.type,
                  value: null
                } as DBOperationResult<T, typeof operation.type>);
              }

              const value = operation.schema
                ? {
                    ...operation.schema.parse(result),
                    ...metadataSchema.parse({
                      timestamp: result.timestamp,
                      version: result.version,
                    }),
                    id: result.id,
                  }
                : result;

              return resolve({
                type: operation.type,
                value: value as StoreItem<T>
              });
            }

            throw new DatabaseError('Unhandled operation type');
          } catch (error) {
            reject(new DatabaseError('Data validation failed', {
              error,
              value: 'value' in operation ? operation.value : undefined
            }));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create store instance
   */
  store<T extends Record<string, unknown>>(
    config: StoreConfig<T>
  ): Store<T> {
    const validatedConfig = this.validateStoreConfig(config);
    return new Store<T>(this, validatedConfig);
  }

  /**
   * Validate store configuration
   */
  private validateStoreConfig<T extends Record<string, unknown>>(
    config: StoreConfig<T>
  ): StoreConfig<T> {
    const storeConfigSchema = z.object({
      name: z.string(),
      schema: z.custom<z.ZodType<T>>((schema) => 
        schema instanceof z.ZodType
      ),
      keyPath: z.string(),
      indexes: z.array(z.object({
        name: z.string(),
        keyPath: z.union([z.string(), z.array(z.string())]),
        options: z.object({
          unique: z.boolean().optional(),
          multiEntry: z.boolean().optional(),
        }).optional(),
      })).optional(),
    });

    return storeConfigSchema.parse(config);
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
   * Delete the database with proper error handling
   */
  static async deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);

      request.onsuccess = () => {
        IndexedDB.instances.delete(name);
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

      request.onblocked = () => {
        const error = new DatabaseError(
          'Database deletion was blocked',
          { dbName: name }
        );
        errorLogger.error('Database deletion was blocked', {
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
   * Get database statistics with error handling
   */
  private async getStoreNames(): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }
    return Array.from(this.db!.objectStoreNames);
  }

  /**
   * Get database statistics with error handling
   */
  async getStats(): Promise<DBStats> {
    if (!this.db) {
      await this.init();
    }

    try {
      const stores = await this.getStoreNames();
      const stats: Record<string, number> = {};
      const errors: Array<{ store: string; error: unknown }> = [];

      await Promise.all(
        stores.map(async (store) => {
          try {
            const countResult = await this.execute({
              store,
              type: DB_OPERATIONS.count,
              mode: 'readonly'
            } as const);

            stats[store] = countResult.value as number;
          } catch (error) {
            errors.push({ store, error });
            stats[store] = 0;
            
            errorLogger.warn(`Failed to get stats for store: ${store}`, {
              component: 'IndexedDB',
              operation: 'getStats',
              store,
              error: formatError(error)
            });
          }
        })
      );

      if (errors.length > 0) {
        toast.warning('Some store statistics could not be retrieved', {
          description: 'The displayed numbers might be incomplete.',
        });
      }

      return {
        stores: stats,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorDetails = formatError(error);
      errorLogger.error('Failed to get database statistics', {
        component: 'IndexedDB',
        operation: 'getStats',
        dbName: this.config.name,
        error: errorDetails
      });
      
      throw new DatabaseError('Failed to get database statistics', errorDetails);
    }
  }

  /**
   * Execute operations in a transaction with improved type safety and race condition handling
   */
  async transaction<R>(
    storeNames: string[],
    mode: IDBTransactionMode,
    callback: (tx: IDBTransaction) => Promise<R>
  ): Promise<R> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise<R>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeNames, mode);
        let result: R | undefined;
        let isCompleted = false;

        // Execute callback immediately
        callback(tx)
          .then((value) => {
            result = value;
            isCompleted = true;
          })
          .catch((error) => {
            tx.abort();
            reject(new DatabaseError('Transaction callback failed', {
              error: formatError(error),
              stores: storeNames,
              mode
            }));
          });
        
        // Handle transaction completion
        tx.oncomplete = () => {
          if (!isCompleted) {
            reject(new DatabaseError('Transaction completed before callback finished', {
              stores: storeNames,
              mode
            }));
            return;
          }
          resolve(result!);
        };

        // Handle transaction errors
        tx.onerror = () => {
          reject(new DatabaseError('Transaction failed', { 
            error: tx.error,
            stores: storeNames,
            mode
          }));
        };

        // Handle transaction abortion
        tx.onabort = () => {
          reject(new DatabaseError('Transaction aborted', { 
            error: tx.error,
            stores: storeNames,
            mode
          }));
        };
      } catch (error) {
        reject(new DatabaseError('Failed to create transaction', {
          error: formatError(error),
          stores: storeNames,
          mode
        }));
      }
    });
  }
} 