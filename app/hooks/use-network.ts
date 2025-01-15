'use client';

import { useState, useEffect } from 'react';
import { NetworkMonitor } from '@/lib/utils/network';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

export function useNetwork() {
  const [status, setStatus] = useState<NetworkStatus>(() => 
    NetworkMonitor.getInstance().getStatus()
  );

  useEffect(() => {
    const unsubscribe = NetworkMonitor.getInstance().subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isConnectionSlow = NetworkMonitor.getInstance().isConnectionSlow();
  const isSaveData = NetworkMonitor.getInstance().isSaveData();
  const connectionMetrics = NetworkMonitor.getInstance().getConnectionMetrics();

  return {
    ...status,
    isConnectionSlow,
    isSaveData,
    connectionMetrics,
  };
} 