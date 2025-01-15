'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { useServiceWorker } from '@/hooks/use-service-worker';

interface ServiceWorkerStatusProps {
  className?: string;
  showControls?: boolean;
}

export function ServiceWorkerStatus({
  className = '',
  showControls = true,
}: ServiceWorkerStatusProps) {
  const {
    isRegistered,
    isUpdating,
    hasUpdate,
    update,
    unregister,
    registration,
  } = useServiceWorker();

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

  if (!('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <div className={className}>
      {/* Main Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-lg transition-all hover:shadow-xl"
      >
        {isRegistered ? (
          <div className="flex items-center gap-2 text-green-600">
            <Power className="h-5 w-5" />
            <span className="text-sm font-medium">Offline Ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-600">
            <PowerOff className="h-5 w-5" />
            <span className="text-sm font-medium">Offline Support Disabled</span>
          </div>
        )}

        {isUpdating && (
          <div className="ml-2 flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Updating...</span>
          </div>
        )}

        {hasUpdate && !isUpdating && (
          <div className="ml-2 flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Update Available</span>
          </div>
        )}
      </button>

      {/* Detailed Status */}
      {showDetails && (
        <div className="mt-2 rounded-lg bg-white p-4 shadow-lg">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Service Worker Status</h3>
            <p className="mt-1 text-xs text-gray-600">
              {isRegistered
                ? 'Offline support is enabled. Content will be available offline.'
                : 'Offline support is disabled. Enable it to use the app offline.'}
            </p>
          </div>

          {registration && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Scope:</span>
                <span className="font-medium">{registration.scope}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">State:</span>
                <span className="font-medium">
                  {registration.active
                    ? 'Active'
                    : registration.installing
                    ? 'Installing'
                    : registration.waiting
                    ? 'Waiting'
                    : 'Unknown'}
                </span>
              </div>
            </div>
          )}

          {showControls && (
            <div className="mt-4 flex gap-2">
              {hasUpdate && (
                <button
                  onClick={update}
                  disabled={isUpdating}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                >
                  {isUpdating && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </button>
              )}

              {isRegistered && (
                <button
                  onClick={unregister}
                  className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  <PowerOff className="h-4 w-4" />
                  Disable Offline Support
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 