'use client';

import { useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import { SyncQueue } from '@/lib/sync/sync-queue';
import { CacheManager } from '@/lib/cache/cache-manager';

interface UseOfflineSyncOptions {
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const syncQueue = SyncQueue.getInstance({
    maxRetries: options.maxRetries,
    retryDelay: options.retryDelay,
    onSyncComplete: options.onSyncComplete,
    onSyncError: options.onSyncError,
  });

  const cacheManager = CacheManager.getInstance();

  const addToSyncQueue = useCallback(async (
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    payload?: any
  ) => {
    try {
      await syncQueue.add({
        type,
        endpoint,
        payload,
      });

      toast({
        title: 'Operation Queued',
        description: navigator.onLine
          ? 'Your changes will be saved shortly.'
          : 'Your changes will be saved when you\'re back online.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to add operation to sync queue:', error);
      toast({
        title: 'Operation Failed',
        description: 'Failed to queue your changes. Please try again.',
        variant: 'destructive',
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