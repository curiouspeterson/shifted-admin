/**
 * Sync Types
 * Last Updated: 2025-01-16
 * 
 * Type definitions for sync operations and storage
 */

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SyncStorage {
  initialize(): Promise<void>;
  addOperation(operation: SyncOperation): Promise<void>;
  updateOperation(operation: SyncOperation): Promise<void>;
  getPendingOperations(): Promise<SyncOperation[]>;
  getAllOperations(): Promise<SyncOperation[]>;
  cleanupOldOperations(before: Date): Promise<void>;
}

export interface SyncStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  lastSync: string | null;
  lastError: string | null;
}

export interface SyncQueueConfig {
  maxRetries?: number;
  retryDelay?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
} 