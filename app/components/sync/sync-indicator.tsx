/**
 * Sync Indicator Component
 * Last Updated: 2025-01-16
 * 
 * Client Component for displaying sync status in the UI
 */

'use client';

import { useSyncContext } from './sync-provider';
import { formatRelativeTime } from '@/lib/utils';

export function SyncIndicator() {
  const { stats, isOnline } = useSyncContext();

  const hasPending = stats.pending > 0 || stats.processing > 0;
  const hasErrors = stats.failed > 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`h-2 w-2 rounded-full ${
        !isOnline ? 'bg-destructive' :
        hasPending ? 'bg-yellow-500 animate-pulse' :
        hasErrors ? 'bg-destructive' :
        'bg-green-500'
      }`} />
      
      <span className="text-muted-foreground">
        {!isOnline ? 'Offline' :
         hasPending ? `Syncing (${stats.pending + stats.processing} pending)` :
         hasErrors ? `${stats.failed} failed` :
         stats.lastSync ? `Last synced ${formatRelativeTime(stats.lastSync)}` :
         'Up to date'
        }
      </span>
    </div>
  );
} 