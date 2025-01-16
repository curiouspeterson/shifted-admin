'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import { BackgroundSync } from '@/lib/utils/background-sync';
import { useNetwork } from '@/hooks/useNetwork';

interface UseBackgroundSyncOptions {
  onSyncComplete?: (task: any) => void;
  onSyncError?: (task: any, error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export function useBackgroundSync(options: UseBackgroundSyncOptions = {}) {
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const { isOnline } = useNetwork();

  const backgroundSync = BackgroundSync.getInstance({
    maxRetries: options.maxRetries,
    retryDelay: options.retryDelay,
    onSyncComplete: (task) => {
      options.onSyncComplete?.(task);
      updateStats();
    },
    onSyncError: (task, error) => {
      options.onSyncError?.(task, error);
      updateStats();
    },
  });

  const updateStats = useCallback(async () => {
    const newStats = await backgroundSync.getStats();
    setStats(newStats);
  }, []);

  useEffect(() => {
    // Update stats initially and when online status changes
    updateStats();
  }, [updateStats, isOnline]);

  const addTask = useCallback(async (
    type: string,
    payload: any
  ) => {
    try {
      await backgroundSync.addTask(type, payload);
      updateStats();
    } catch (error) {
      console.error('Failed to add background sync task:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to queue task for background sync.',
        variant: 'destructive',
      });
    }
  }, [updateStats]);

  const clearCompletedTasks = useCallback(async () => {
    try {
      await backgroundSync.clearCompletedTasks();
      updateStats();
      
      toast({
        title: 'Tasks Cleared',
        description: 'Completed tasks have been cleared.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to clear completed tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear completed tasks.',
        variant: 'destructive',
      });
    }
  }, [updateStats]);

  return {
    stats,
    addTask,
    clearCompletedTasks,
    isOnline,
  };
} 