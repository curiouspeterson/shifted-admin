'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useNetwork } from '@/hooks/useNetwork';

interface OfflineFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  showLastUpdated?: boolean;
  lastUpdated?: number;
}

export function OfflineFallback({
  children,
  fallback,
  className = '',
  showLastUpdated = false,
  lastUpdated,
}: OfflineFallbackProps) {
  const { isOnline, connectionMetrics } = useNetwork();
  const [isStale, setIsStale] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  // Check if data is stale (older than 5 minutes)
  useEffect(() => {
    if (lastUpdated) {
      const checkStale = () => {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        setIsStale(now - lastUpdated > fiveMinutes);
      };

      checkStale();
      const interval = setInterval(checkStale, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [lastUpdated]);

  // Show retry button after 3 seconds offline
  useEffect(() => {
    if (!isOnline) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [isOnline]);

  // If online and not stale, show children
  if (isOnline && !isStale) {
    return <>{children}</>;
  }

  // If offline or stale, show fallback
  return (
    <div className={className}>
      {fallback || (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-gray-50 p-8 text-center">
          {!isOnline ? (
            <>
              <WifiOff className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">You're Offline</h3>
              <p className="text-sm text-gray-600">
                Check your internet connection and try again.
              </p>
              {showRetry && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
            </>
          ) : isStale ? (
            <>
              <Clock className="h-12 w-12 text-yellow-400" />
              <h3 className="text-lg font-semibold text-gray-900">Content May Be Outdated</h3>
              <p className="text-sm text-gray-600">
                This content was last updated{' '}
                {lastUpdated ? (
                  <time dateTime={new Date(lastUpdated).toISOString()}>
                    {new Date(lastUpdated).toLocaleString()}
                  </time>
                ) : (
                  'some time ago'
                )}
                .
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </>
          ) : null}

          {showLastUpdated && lastUpdated && (
            <div className="mt-4 text-xs text-gray-500">
              Last updated:{' '}
              <time dateTime={new Date(lastUpdated).toISOString()}>
                {new Date(lastUpdated).toLocaleString()}
              </time>
            </div>
          )}

          {connectionMetrics && (
            <div className="mt-2 text-xs text-gray-500">
              Connection: {connectionMetrics.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 