/**
 * IndexedDB Utilities
 * Last Updated: 2025-01-17
 * 
 * Modern IndexedDB wrapper with offline support, encryption, and compression.
 * Implements 2025 best practices for type safety and error handling.
 */

import { DatabaseError } from '@/lib/errors';
import { toast } from 'sonner';
import { z } from 'zod';
import { errorLogger } from '@/lib/logging/error-logger';

// Operation constants
export const DB_OPERATIONS = {
  add: 'add',
  put: 'put',
  get: 'get',
  getAll: 'getAll',
  delete: 'delete',
  clear: 'clear',
  count: 'count'
} as const;

// Type definitions
export type DBOperationType = typeof DB_OPERATIONS[keyof typeof DB_OPERATIONS];
export type DBErrorCode = `DB_${Uppercase<string>}_ERROR`;
export type StoreName<T extends Record<string, unknown>> = keyof T & string;

// Base types
export interface IDBOperationConfig<T> {
  store: string;
  type: DBOperationType;
  key?: IDBValidKey;
  value?: T;
  schema?: z.ZodType<T>;
  mode?: IDBTransactionMode;
}

export interface IDBOperationResult<T> {
  success: boolean;
  data: T | null;
  error?: DBErrorDetails;
  timestamp: number;
  version?: number | undefined;
}

export interface IIndexedDB {
  execute<T extends Record<string, unknown>>(
    operation: IDBOperationConfig<T>
  ): Promise<IDBOperationResult<T>>;
}

// Error interfaces
export interface DBErrorDetails {
  code: DBErrorCode;
  name: string;
  message: string;
  timestamp: number;
  stack?: string | undefined;
  details?: Record<string, unknown> | undefined;
  cause?: {
    name: string;
    message: string;
    stack?: string | undefined;
  } | undefined;
  context: {
    operation?: DBOperationType;
    store?: string;
    key?: IDBValidKey;
    cause?: unknown;
  };
}

// Operation result types
export type DBOperationResult<T> = {
  success: boolean;
  data: T | null;
  error?: DBErrorDetails;
  timestamp: number;
  version?: number | undefined;
};

// Schema validation
export const storeMetadataSchema = z.object({
  timestamp: z.number(),
  version: z.number().optional(),
  lastModified: z.date(),
  checksum: z.string()
});

export type StoreMetadata = z.infer<typeof storeMetadataSchema>;

// Store configuration
export interface StoreConfig<T> {
  name: string;
  schema: z.ZodType<T>;
  keyPath: string;
  indexes?: Array<{
    name: string;
    keyPath: string | string[];
    options?: {
      unique?: boolean;
      multiEntry?: boolean;
    };
  }>;
}

/**
 * Transaction management with proper performance optimizations
 */
export class TransactionManager {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunk size
  private static readonly MAX_BATCH_SIZE = 100;

  constructor(
    private readonly db: IDBDatabase,
    private readonly options: {
      maxConcurrentTransactions?: number;
      transactionTimeout?: number;
    } = {}
  ) {}

  /**
   * Execute operation with automatic chunking and transaction management
   */
  async executeWithTransaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    operation: (tx: IDBTransaction) => Promise<T>
  ): Promise<T> {
    const tx = this.db.transaction(stores, mode, {
      durability: 'strict'
    });

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        tx.abort();
        reject(new DatabaseError('Transaction timeout'));
      }, this.options.transactionTimeout ?? 5000);

      tx.oncomplete = () => {
        clearTimeout(timeoutId);
        resolve(result);
      };

      tx.onerror = () => {
        clearTimeout(timeoutId);
        reject(tx.error);
      };

      tx.onabort = () => {
        clearTimeout(timeoutId);
        reject(new DatabaseError('Transaction aborted'));
      };

      let result: T;
      operation(tx).then(
        (value) => { result = value; },
        (error) => { tx.abort(); reject(error); }
      );
    });
  }

  /**
   * Chunk large data for better performance
   */
  async writeInChunks<T>(
    store: IDBObjectStore,
    data: T[],
    operation: 'add' | 'put' = 'add'
  ): Promise<void> {
    const chunks = this.chunkData(data);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(item => store[operation](item))
      );
    }
  }

  /**
   * Optimize data for structured cloning
   */
  private chunkData<T>(data: T[]): T[][] {
    const chunks: T[][] = [];
    const totalSize = this.estimateSize(data);
    
    if (totalSize <= TransactionManager.CHUNK_SIZE) {
      return [data];
    }

    const itemsPerChunk = Math.min(
      TransactionManager.MAX_BATCH_SIZE,
      Math.ceil(TransactionManager.CHUNK_SIZE / (totalSize / data.length))
    );

    for (let i = 0; i < data.length; i += itemsPerChunk) {
      chunks.push(data.slice(i, i + itemsPerChunk));
    }

    return chunks;
  }

  /**
   * Estimate size of data for chunking
   */
  private estimateSize(data: unknown): number {
    const serialized = JSON.stringify(data);
    return new TextEncoder().encode(serialized).length;
  }
}

/**
 * Background sync and offline support
 */
export interface SyncOptions {
  enabled: boolean;
  periodic?: boolean;
  minInterval?: number;
  maxRetries?: number;
  conflictResolution?: 'client' | 'server' | 'manual';
}

export interface SyncEntry<T> {
  id: string;
  operation: IDBOperationConfig<T>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

/**
 * Background sync manager for offline operations
 */
export class BackgroundSyncManager<T extends Record<string, unknown>> {
  private static readonly SYNC_STORE = 'syncQueue';
  private static readonly DEFAULT_MAX_RETRIES = 5;
  private static readonly DEFAULT_SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour

  private isProcessing = false;
  private syncRegistration?: ServiceWorkerRegistration;
  private readonly txManager: TransactionManager;

  constructor(
    private readonly db: IDBDatabase,
    private readonly options: SyncOptions,
    private readonly onSync?: (entry: SyncEntry<T>) => Promise<void>
  ) {
    this.txManager = new TransactionManager(db, {
      maxConcurrentTransactions: 1,
      transactionTimeout: 30000 // 30 seconds for sync operations
    });

    if (options.enabled) {
      this.initialize().catch(error => {
        errorLogger.error('Failed to initialize background sync', {
          error,
          options
        });
      });
    }
  }

  /**
   * Initialize background sync
   */
  private async initialize(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        this.syncRegistration = await navigator.serviceWorker.ready;

        if (this.options.periodic && 'periodicSync' in this.syncRegistration) {
          await (this.syncRegistration as any).periodicSync.register('offlineSync', {
            minInterval: this.options.minInterval ?? BackgroundSyncManager.DEFAULT_SYNC_INTERVAL
          });
        }

        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data.type === 'sync-required') {
            await this.processQueue();
          }
        });

        if ('sync' in this.syncRegistration) {
          await this.syncRegistration.sync.register('offlineSync');
        }
      }
    } catch (error) {
      errorLogger.error('Failed to initialize background sync', { error });
      throw error;
    }
  }

  /**
   * Queue operation for background sync
   */
  async queueOperation(operation: IDBOperationConfig<T>): Promise<void> {
    const entry: SyncEntry<T> = {
      id: crypto.randomUUID(),
      operation,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    await this.txManager.executeWithTransaction(
      [BackgroundSyncManager.SYNC_STORE],
      'readwrite',
      async (tx: IDBTransaction) => {
        const store = tx.objectStore(BackgroundSyncManager.SYNC_STORE);
        await store.add(entry);
      }
    );

    if (this.syncRegistration && 'sync' in this.syncRegistration) {
      await this.syncRegistration.sync.register('offlineSync');
    }
  }

  /**
   * Process queued operations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;
    this.isProcessing = true;

    try {
      const entries = await this.txManager.executeWithTransaction(
        [BackgroundSyncManager.SYNC_STORE],
        'readonly',
        async (tx: IDBTransaction) => {
          const store = tx.objectStore(BackgroundSyncManager.SYNC_STORE);
          const request = store.getAll();
          return new Promise<SyncEntry<T>[]>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as SyncEntry<T>[]);
            request.onerror = () => reject(request.error);
          });
        }
      );

      for (const entry of entries) {
        if (entry.retryCount >= (this.options.maxRetries ?? BackgroundSyncManager.DEFAULT_MAX_RETRIES)) {
          await this.updateEntryStatus(entry.id, 'failed');
          continue;
        }

        try {
          await this.updateEntryStatus(entry.id, 'processing');
          
          if (this.onSync) {
            await this.onSync(entry);
          }

          await this.updateEntryStatus(entry.id, 'completed');
        } catch (error) {
          await this.updateRetryCount(entry);
          errorLogger.error('Failed to process sync entry', {
            error,
            entry
                    });
                  }
                }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update entry status
   */
  private async updateEntryStatus(
    id: string,
    status: SyncEntry<T>['status']
  ): Promise<void> {
    await this.txManager.executeWithTransaction(
      [BackgroundSyncManager.SYNC_STORE],
      'readwrite',
      async (tx: IDBTransaction) => {
        const store = tx.objectStore(BackgroundSyncManager.SYNC_STORE);
        const request = store.get(id);
        const entry = await new Promise<SyncEntry<T> | undefined>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as SyncEntry<T>);
          request.onerror = () => reject(request.error);
        });

        if (entry) {
          entry.status = status;
          await store.put(entry);
        }
      }
    );
  }

  /**
   * Update retry count for failed operations
   */
  private async updateRetryCount(entry: SyncEntry<T>): Promise<void> {
    await this.txManager.executeWithTransaction(
      [BackgroundSyncManager.SYNC_STORE],
      'readwrite',
      async (tx: IDBTransaction) => {
        const store = tx.objectStore(BackgroundSyncManager.SYNC_STORE);
        entry.retryCount++;
        entry.lastError = new Date().toISOString();
        entry.status = 'pending';
        await store.put(entry);
      }
    );
  }
}

/**
 * Security and compression options
 */
export interface SecurityOptions {
  encryption?: {
    enabled: boolean;
    algorithm?: 'AES-GCM' | 'AES-CBC';
    keyDerivation?: 'PBKDF2' | 'HKDF';
    keyLength?: 128 | 192 | 256;
  };
  compression?: {
    enabled: boolean;
    threshold?: number; // Size in bytes
    algorithm?: 'gzip' | 'deflate';
  };
}

/**
 * Data transformer for encryption and compression
 */
export class DataTransformer {
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;
  private static readonly DEFAULT_KEY_LENGTH = 256;
  private static readonly DEFAULT_ITERATIONS = 100000;
  private static readonly DEFAULT_COMPRESSION_THRESHOLD = 1024; // 1KB

  private cryptoKey?: CryptoKey;
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  constructor(
    private readonly options: SecurityOptions = {}
  ) {}

  /**
   * Initialize encryption
   */
  async initialize(password?: string): Promise<void> {
    if (this.options.encryption?.enabled && password) {
      const salt = crypto.getRandomValues(new Uint8Array(DataTransformer.SALT_LENGTH));
      const keyMaterial = await this.getKeyMaterial(password);
      
      this.cryptoKey = await crypto.subtle.deriveKey(
        {
          name: this.options.encryption.keyDerivation || 'PBKDF2',
          salt,
          iterations: DataTransformer.DEFAULT_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: this.options.encryption.algorithm || 'AES-GCM',
          length: this.options.encryption.keyLength || DataTransformer.DEFAULT_KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );
    }
  }

  /**
   * Transform data for storage with encryption and compression
   */
  async transform<T>(data: T): Promise<ArrayBuffer> {
    // Convert data to bytes
    const serialized = JSON.stringify(data);
    let bytes = this.encoder.encode(serialized);

    // Compress if enabled and data is large enough
    if (
      this.options.compression?.enabled &&
      bytes.length > (this.options.compression.threshold ?? DataTransformer.DEFAULT_COMPRESSION_THRESHOLD)
    ) {
      bytes = await this.compress(bytes);
    }

    // Encrypt if enabled
    if (this.options.encryption?.enabled && this.cryptoKey) {
      const iv = crypto.getRandomValues(new Uint8Array(DataTransformer.IV_LENGTH));
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.options.encryption.algorithm || 'AES-GCM',
          iv
        },
        this.cryptoKey,
        bytes
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      return combined.buffer;
    }

    return bytes.buffer;
  }

  /**
   * Restore data from storage with decryption and decompression
   */
  async restore<T>(data: ArrayBuffer): Promise<T> {
    let bytes = new Uint8Array(data);

    // Decrypt if enabled
    if (this.options.encryption?.enabled && this.cryptoKey) {
      const iv = bytes.slice(0, DataTransformer.IV_LENGTH);
      const encrypted = bytes.slice(DataTransformer.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.options.encryption.algorithm || 'AES-GCM',
          iv
        },
        this.cryptoKey,
        encrypted
      );

      bytes = new Uint8Array(decrypted);
    }

    // Decompress if enabled
    if (this.options.compression?.enabled) {
      bytes = await this.decompress(bytes);
    }

    // Convert bytes back to data
    const serialized = this.decoder.decode(bytes);
    return JSON.parse(serialized) as T;
  }

  /**
   * Get key material for encryption
   */
  private async getKeyMaterial(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }

  /**
   * Compress data using Compression Streams API
   */
  private async compress(data: Uint8Array): Promise<Uint8Array> {
    // Use CompressionStream when available
    if ('CompressionStream' in self) {
      const cs = new CompressionStream(this.options.compression?.algorithm || 'gzip');
      const writer = cs.writable.getWriter();
      await writer.write(data);
      await writer.close();
      return new Response(cs.readable).arrayBuffer().then(buf => new Uint8Array(buf));
    }

    // Skip compression if not available
    return data;
  }

  /**
   * Decompress data using Compression Streams API
   */
  private async decompress(data: Uint8Array): Promise<Uint8Array> {
    // Use DecompressionStream when available
    if ('DecompressionStream' in self) {
      const ds = new DecompressionStream(this.options.compression?.algorithm || 'gzip');
      const writer = ds.writable.getWriter();
      await writer.write(data);
      await writer.close();
      return new Response(ds.readable).arrayBuffer().then(buf => new Uint8Array(buf));
    }

    // Skip decompression if not available
    return data;
  }
}

/**
 * Enhanced store operations with security features
 */
export class Store<T extends Record<string, unknown>> {
  private readonly txManager: TransactionManager;
  private readonly syncManager?: BackgroundSyncManager<T>;
  private readonly transformer: DataTransformer;

  constructor(
    private readonly db: IIndexedDB,
    private readonly config: StoreConfig<T>,
    private readonly options: {
      maxConcurrentTransactions?: number;
      transactionTimeout?: number;
      chunkSize?: number;
      sync?: SyncOptions;
      security?: SecurityOptions;
    } = {}
  ) {
    const idb = db as unknown as IDBDatabase;
    this.txManager = new TransactionManager(idb, options);
    this.transformer = new DataTransformer(options.security);
    
    if (options.sync?.enabled) {
      this.syncManager = new BackgroundSyncManager(
        idb,
        options.sync,
        this.handleSync.bind(this)
      );
    }
  }

  /**
   * Initialize store with encryption
   */
  async initialize(password?: string): Promise<void> {
    if (this.options.security?.encryption?.enabled) {
      await this.transformer.initialize(password);
    }
  }

  protected formatError(error: unknown): DBErrorDetails {
    const timestamp = Date.now();
    
    if (error instanceof DatabaseError) {
      return {
        code: `DB_${error.name.toUpperCase()}_ERROR` as DBErrorCode,
        name: error.name,
        message: error.message,
        timestamp,
        stack: error.stack,
        details: error.details,
        context: {
          cause: error.cause
        }
      };
    }

    if (error instanceof DOMException) {
      return {
        code: 'DB_DOM_ERROR' as DBErrorCode,
        name: error.name,
        message: error.message,
        timestamp,
        stack: error.stack,
        context: {
          cause: error
        }
      };
    }

    return {
      code: 'DB_UNKNOWN_ERROR' as DBErrorCode,
      name: 'UnknownError',
      message: String(error),
      timestamp,
      context: { cause: error }
    };
  }

  /**
   * Type-safe CRUD operations with explicit return types
   */
  async findById(id: string): Promise<DBOperationResult<T>> {
    try {
      const result = await this.db.execute({
        store: this.config.name,
        type: DB_OPERATIONS.get,
        key: id,
        schema: this.config.schema
      } as const);

      return {
        success: true,
        data: result.data as T,
        timestamp: Date.now(),
        version: result.version
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.formatError(error),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Bulk write operations with automatic chunking
   */
  async bulkWrite(items: T[]): Promise<DBOperationResult<T[]>> {
    try {
      await this.txManager.executeWithTransaction(
        [this.config.name],
        'readwrite',
        async (tx) => {
          const store = tx.objectStore(this.config.name);
          await this.txManager.writeInChunks(store, items);
        }
      );

      return {
        success: true,
        data: items,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.formatError(error),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Optimized batch read operation
   */
  async batchGet(ids: string[]): Promise<DBOperationResult<T[]>> {
    try {
      const results = await this.txManager.executeWithTransaction(
        [this.config.name],
        'readonly',
        async (tx) => {
          const store = tx.objectStore(this.config.name);
          const requests = ids.map(id => store.get(id));
          const values = await Promise.all(
            requests.map(request => new Promise<unknown>((resolve) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => resolve(undefined);
            }))
          );
          
          // Validate and filter results
          return values
            .filter((value): value is unknown => value !== undefined)
            .map(value => {
              try {
                return this.config.schema.parse(value) as T;
              } catch {
                return undefined;
              }
            })
            .filter((value): value is T => value !== undefined);
        }
      );

      return {
        success: true,
        data: results,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.formatError(error),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Handle sync operation
   */
  private async handleSync(entry: SyncEntry<T>): Promise<void> {
    const { operation } = entry;

    // Skip read operations
    if (operation.type === 'get' || operation.type === 'getAll') {
      return;
    }

    try {
      // Handle conflicts if needed
      if (this.options.sync?.conflictResolution) {
        const serverState = await this.fetchServerState(operation);
        const conflict = await this.detectConflict(operation, serverState);
        
        if (conflict) {
          switch (this.options.sync.conflictResolution) {
            case 'server':
              await this.applyServerState(operation, serverState);
              return;
            case 'manual':
              // Skip for manual resolution
              return;
            // 'client' is default - continue with operation
          }
        }
      }

      // Execute operation
      await this.db.execute(operation);
    } catch (error) {
      errorLogger.error('Failed to sync operation', {
        error: this.formatError(error),
        operation
      });
      throw error;
    }
  }

  /**
   * Fetch server state for conflict resolution
   */
  private async fetchServerState(operation: IDBOperationConfig<T>): Promise<T | null> {
    // Implement server state fetch logic
    return null;
  }

  /**
   * Detect conflicts between client and server state
   */
  private async detectConflict(
    operation: IDBOperationConfig<T>,
    serverState: T | null
  ): Promise<boolean> {
    if (!serverState) return false;

    // Implement conflict detection logic
    return false;
  }

  /**
   * Apply server state in case of conflict
   */
  private async applyServerState(
    operation: IDBOperationConfig<T>,
    serverState: T | null
  ): Promise<void> {
    if (!serverState) return;

    // Implement server state application logic
  }

  /**
   * Write operation with data transformation
   */
  private async writeWithTransform(
    operation: IDBOperationConfig<T>
  ): Promise<IDBOperationResult<T>> {
    const transformedOperation = { ...operation };

    if ('value' in operation && operation.value) {
      const transformed = await this.transformer.transform(operation.value);
      transformedOperation.value = transformed as unknown as T;
    }

    const result = await this.db.execute(transformedOperation);
    const transformedResult: IDBOperationResult<T> = {
      ...result,
      data: null
    };

    if (result.data) {
      const restored = await this.transformer.restore<T>(result.data as unknown as ArrayBuffer);
      transformedResult.data = restored;
    }

    return transformedResult;
  }
}

// ... rest of the file remains unchanged ... 