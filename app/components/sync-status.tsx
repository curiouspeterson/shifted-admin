'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useBackgroundSync } from '@/hooks/useBackground-sync';
import { useNetwork } from '@/hooks/useNetwork';

interface SyncStatusProps {
  className?: string;
}

export function SyncStatus({ className }: SyncStatusProps) {
  const { stats, clearCompletedTasks } = useBackgroundSync();
  const { isOnline, connectionMetrics } = useNetwork();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide details after 5 seconds
  useEffect(() => {
    if (showDetails) {
      const timer = setTimeout(() => {
        setShowDetails(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showDetails]);

  // Don't show anything if everything is synced and online
  if (isOnline && stats.pending === 0 && stats.processing === 0 && stats.failed === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 flex flex-col gap-2 ${className}`}>
      {/* Main Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-lg transition-all hover:shadow-xl"
      >
        {!isOnline && (
          <div className="flex items-center gap-2 text-red-600">
            <CloudOff className="h-5 w-5" />
            <span className="text-sm font-medium">Offline</span>
          </div>
        )}

        {isOnline && stats.processing > 0 && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Syncing...</span>
          </div>
        )}

        {isOnline && stats.failed > 0 && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">{stats.failed} failed</span>
          </div>
        )}

        {isOnline && stats.pending > 0 && stats.processing === 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <Cloud className="h-5 w-5" />
            <span className="text-sm font-medium">{stats.pending} pending</span>
          </div>
        )}
      </button>

      {/* Detailed Status */}
      {showDetails && (
        <div className="rounded-lg bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Sync Status</h3>
            {stats.completed > 0 && (
              <button
                onClick={clearCompletedTasks}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connection:</span>
              <span className={`font-medium ${
                connectionMetrics.quality === 'good' ? 'text-green-600' :
                connectionMetrics.quality === 'fair' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {connectionMetrics.description}
              </span>
            </div>

            {/* Sync Stats */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-medium">{stats.pending}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Processing:</span>
              <span className="font-medium">{stats.processing}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">{stats.completed}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">{stats.failed}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 