/**
 * Network Status Hook
 * Last Updated: January 15, 2024
 * 
 * Custom hook for monitoring network connectivity status.
 * Provides real-time updates on connection state and quality.
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/utils/toast';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
  });

  useEffect(() => {
    // Initial status
    setStatus({
      isOnline: navigator.onLine,
      effectiveType: (navigator.connection as any)?.effectiveType,
      downlink: (navigator.connection as any)?.downlink,
      rtt: (navigator.connection as any)?.rtt,
      saveData: (navigator.connection as any)?.saveData,
    });

    // Handle online status changes
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      toast.success('Back online');
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      toast.error('You are offline');
    };

    // Handle connection changes
    const handleConnectionChange = () => {
      setStatus(prev => ({
        ...prev,
        effectiveType: (navigator.connection as any)?.effectiveType,
        downlink: (navigator.connection as any)?.downlink,
        rtt: (navigator.connection as any)?.rtt,
        saveData: (navigator.connection as any)?.saveData,
      }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    (navigator.connection as any)?.addEventListener('change', handleConnectionChange);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      (navigator.connection as any)?.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  return status;
} 