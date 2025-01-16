/**
 * Offline Sync Hook
 * Last Updated: 2024-01-15
 * 
 * Manages offline data synchronization with proper type safety
 * and error handling.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import { SyncQueue } from '@/lib/sync/sync-queue';
import { CacheManager } from '@/lib/cache/cacheManager';

interface UseOfflineSyncOptions {
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

type SyncOperation = 'create' | 'update' | 'delete';

interface SyncPayload<T = unknown> {
  type: SyncOperation;
  endpoint: string;
  payload?: T;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const syncQueue = SyncQueue.getInstance({
    maxRetries: options.maxRetries,
    retryDelay: options.retryDelay,
    onSyncComplete: options.onSyncComplete,
    onSyncError: options.onSyncError,
  });

  const cacheManager = CacheManager.getInstance();

  const addToSyncQueue = useCallback(async <T>(
    type: SyncOperation,
    endpoint: string,
    payload?: T
  ) => {
    try {
      await syncQueue.add({
        type,
        endpoint,
        payload,
      });

      toast('Operation Queued', {
        description: navigator.onLine
          ? 'Your changes will be saved shortly.'
          : 'Your changes will be saved when you\'re back online.',
      });
    } catch (error) {
      console.error('Failed to add operation to sync queue:', error);
      toast.error('Operation Failed', {
        description: 'Failed to queue your changes. Please try again.',
      });
    }
  }, []);

  const invalidateCache = useCallback((pattern: RegExp) => {
    cacheManager.invalidatePattern(pattern);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      syncQueue.processQueue();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncQueue.processQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Process queue on mount if online
    if (navigator.onLine) {
      syncQueue.processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    addToSyncQueue,
    invalidateCache,
    getPendingChanges: () => syncQueue.getQueueLength(),
    clearSyncQueue: () => syncQueue.clear(),
  };
} 