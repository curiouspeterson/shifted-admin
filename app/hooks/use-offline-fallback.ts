'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import { OfflineFallback } from '@/lib/utils/offline-fallback';
import { useNetwork } from '@/hooks/use-network';

interface UseOfflineFallbackOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  forceNetwork?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface FallbackState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  source: 'network' | 'cache' | null;
  timestamp: number | null;
}

export function useOfflineFallback<T>({
  key,
  fetcher,
  ttl,
  forceNetwork = false,
  retryAttempts = 3,
  retryDelay = 1000,
  onSuccess,
  onError,
}: UseOfflineFallbackOptions<T>) {
  const [state, setState] = useState<FallbackState<T>>({
    data: null,
    isLoading: true,
    error: null,
    source: null,
    timestamp: null,
  });

  const { isOnline } = useNetwork();
  const fallback = OfflineFallback.getInstance();

  const fetchData = useCallback(async (force = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fallback.fetch(fetcher, {
        key,
        ttl,
        forceNetwork: force || forceNetwork,
        retryAttempts,
        retryDelay,
      });

      setState({
        data: result.data,
        isLoading: false,
        error: result.error || null,
        source: result.source,
        timestamp: result.timestamp,
      });

      if (result.data && !result.error) {
        onSuccess?.(result.data);
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      onError?.(error as Error);
    }
  }, [key, fetcher, ttl, forceNetwork, retryAttempts, retryDelay, onSuccess, onError]);

  // Fetch data on mount and when online status changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show appropriate toasts based on state changes
  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Error',
        description: state.error.message,
        variant: 'destructive',
      });
    } else if (state.source === 'cache' && isOnline) {
      toast({
        title: 'Using Cached Data',
        description: 'Could not fetch latest data. Using cached version.',
        variant: 'destructive',
      });
    }
  }, [state.error, state.source, isOnline]);

  const refresh = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot refresh while offline.',
        variant: 'destructive',
      });
      return;
    }

    await fetchData(true);
  }, [isOnline, fetchData]);

  const clearCache = useCallback(async () => {
    try {
      await fallback.clearAll();
      toast({
        title: 'Cache Cleared',
        description: 'Offline cache has been cleared.',
        variant: 'default',
      });
      if (isOnline) {
        await fetchData(true);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear offline cache.',
        variant: 'destructive',
      });
    }
  }, [isOnline, fetchData]);

  return {
    ...state,
    refresh,
    clearCache,
    isStale: state.source === 'cache' && isOnline,
  };
} 