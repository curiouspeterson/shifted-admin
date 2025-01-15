'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import { OfflineStorage } from '@/lib/utils/offline';
import { useNetwork } from '@/hooks/use-network';

interface UseOfflineDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export function useOfflineData<T>({
  key,
  fetcher,
  ttl,
  onSyncComplete,
  onSyncError,
}: UseOfflineDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useNetwork();

  // Load data from offline storage or fetch from network
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get data from offline storage first
      const cachedData = await OfflineStorage.retrieve<T>(key);
      
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
      }

      // If online, fetch fresh data
      if (isOnline) {
        try {
          setIsSyncing(true);
          const freshData = await fetcher();
          
          // Store in offline storage
          await OfflineStorage.store(key, freshData, ttl);
          
          setData(freshData);
          onSyncComplete?.();
          
          // Show toast only if data was updated
          if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
            toast({
              title: 'Data Updated',
              description: 'Latest data has been synchronized.',
              variant: 'default',
            });
          }
        } catch (error) {
          console.error('Failed to fetch fresh data:', error);
          onSyncError?.(error as Error);
          
          // If we have cached data, show warning toast
          if (cachedData) {
            toast({
              title: 'Sync Failed',
              description: 'Using cached data. Some information may be outdated.',
              variant: 'destructive',
            });
          } else {
            throw error; // Re-throw if no cached data
          }
        } finally {
          setIsSyncing(false);
        }
      } else if (!cachedData) {
        // If offline and no cached data, show error
        throw new Error('No internet connection and no cached data available');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error as Error);
      onSyncError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, isOnline, onSyncComplete, onSyncError]);

  // Load data on mount and when online status changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Force refresh data
  const refresh = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot refresh while offline.',
        variant: 'destructive',
      });
      return;
    }

    await loadData();
  }, [isOnline, loadData]);

  // Clear cached data
  const clearCache = useCallback(async () => {
    try {
      await OfflineStorage.remove(key);
      toast({
        title: 'Cache Cleared',
        description: 'Offline data has been cleared.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear offline data.',
        variant: 'destructive',
      });
    }
  }, [key]);

  return {
    data,
    isLoading,
    isSyncing,
    error,
    refresh,
    clearCache,
  };
} 