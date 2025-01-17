/**
 * Sync Status Component
 * Last Updated: 2025-01-16
 * 
 * Server Component for displaying sync status
 */

import { type SyncStats } from '@/lib/types/sync';
import { formatRelativeTime } from '@/lib/utils';

async function getSyncStats(): Promise<SyncStats> {
  const response = await fetch('/api/sync', {
    next: { 
      revalidate: 30 // Revalidate every 30 seconds
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sync stats');
  }

  const data = await response.json();
  return data.stats;
}

export default async function SyncStatus() {
  const stats = await getSyncStats();

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Sync Status</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold">{stats.failed}</p>
        </div>
      </div>

      {stats.lastSync && (
        <div className="mt-4 text-sm text-muted-foreground">
          Last synced: {formatRelativeTime(stats.lastSync)}
        </div>
      )}
      
      {stats.lastError && (
        <div className="mt-2 text-sm text-destructive">
          Last error: {formatRelativeTime(stats.lastError)}
        </div>
      )}
    </div>
  );
} 