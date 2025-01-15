'use client';

import { useEffect, useState } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back Online',
        description: 'Your connection has been restored.',
        variant: 'default',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re Offline',
        description: 'Changes will be synced when you\'re back online.',
        variant: 'destructive',
      });
    };

    // Listen for sync events from service worker
    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'sync-started') {
        setIsSyncing(true);
      } else if (event.data.type === 'sync-completed') {
        setIsSyncing(false);
        toast({
          title: 'Sync Complete',
          description: 'All changes have been synchronized.',
          variant: 'default',
        });
      } else if (event.data.type === 'pending-changes') {
        setPendingChanges(event.data.count);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSync);
    };
  }, []);

  if (isOnline && !isSyncing && pendingChanges === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white p-3 shadow-lg ${className}`}>
      {!isOnline && (
        <div className="flex items-center gap-2 text-red-600">
          <WifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      )}

      {isOnline && pendingChanges > 0 && (
        <div className="flex items-center gap-2 text-yellow-600">
          <CloudOff className="h-5 w-5" />
          <span className="text-sm font-medium">{pendingChanges} pending changes</span>
        </div>
      )}

      {isSyncing && (
        <div className="flex items-center gap-2 text-blue-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Syncing...</span>
        </div>
      )}
    </div>
  );
} 