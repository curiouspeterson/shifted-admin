/**
 * Background Sync Hook
 * Last Updated: 2025-01-16
 * 
 * React hook for managing background sync state
 */

import { useEffect, useState } from 'react';
import { type SyncStats } from '@/lib/types/sync';
import { BackgroundSyncService } from '@/lib/sync/background-sync-service';
import { LocalStorageSync } from '@/lib/sync/local-storage';
import { toast } from '@/components/ui/toast';

export function useBackgroundSync() {
  const [stats, setStats] = useState<SyncStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    lastSync: null,
    lastError: null,
  });

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Initialize sync service
    const storage = new LocalStorageSync();
    const syncService = BackgroundSyncService.getInstance(storage, {
      maxRetries: 3,
      retryDelay: 5000,
      onSyncComplete: () => {
        toast.success('Sync completed successfully');
        updateStats();
      },
      onSyncError: (error) => {
        toast.error('Sync failed', {
          description: error.message,
        });
        updateStats();
      },
    });

    // Initialize and start sync
    syncService.initialize().catch((error) => {
      toast.error('Failed to initialize sync', {
        description: error.message,
      });
    });

    // Update stats periodically
    const updateStats = async () => {
      try {
        const currentStats = await syncService.getStats();
        setStats(currentStats);
      } catch (error) {
        console.error('Failed to update sync stats:', error);
      }
    };

    const statsInterval = setInterval(updateStats, 30000);
    updateStats();

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
      updateStats();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline', {
        description: 'Changes will be synced when you reconnect',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(statsInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    stats,
    isOnline,
  };
} 