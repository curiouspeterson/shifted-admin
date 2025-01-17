'use client';

import { useEffect, useState } from 'react';
import { Archive, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNetwork } from '@/hooks/use-network';

interface CachedContentProps {
  children: React.ReactNode;
  timestamp: number;
  onRefresh?: () => void;
  className?: string;
  showAge?: boolean;
  maxAge?: number;
  showRefreshButton?: boolean;
}

export function CachedContent({
  children,
  timestamp,
  onRefresh,
  className = '',
  showAge = true,
  maxAge = 5 * 60 * 1000, // 5 minutes
  showRefreshButton = true,
}: CachedContentProps) {
  const { isOnline } = useNetwork();
  const [isStale, setIsStale] = useState(false);
  const [age, setAge] = useState<string>('');

  // Update content age every minute
  useEffect(() => {
    const updateAge = () => {
      const now = Date.now();
      const diff = now - timestamp;
      
      // Check if content is stale
      setIsStale(diff > maxAge);

      // Format age string
      if (diff < 60000) { // Less than 1 minute
        setAge('just now');
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        setAge(`${minutes} minute${minutes === 1 ? '' : 's'} ago`);
      } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        setAge(`${hours} hour${hours === 1 ? '' : 's'} ago`);
      } else {
        const days = Math.floor(diff / 86400000);
        setAge(`${days} day${days === 1 ? '' : 's'} ago`);
      }
    };

    updateAge();
    const interval = setInterval(updateAge, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp, maxAge]);

  return (
    <div className={className}>
      {/* Content */}
      {children}

      {/* Cache Indicator */}
      <div className="mt-2 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">
            Cached {showAge && <span className="text-gray-500">• {age}</span>}
          </span>
        </div>

        {isStale && isOnline && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Content may be outdated</span>
          </div>
        )}

        {showRefreshButton && isOnline && onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-1 text-right text-xs text-gray-500">
        Last updated:{' '}
        <time dateTime={new Date(timestamp).toISOString()}>
          {new Date(timestamp).toLocaleString()}
        </time>
      </div>
    </div>
  );
} 