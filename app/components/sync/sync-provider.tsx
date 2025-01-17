/**
 * Sync Provider Component
 * Last Updated: 2025-01-16
 * 
 * Client Component wrapper for sync functionality
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useBackgroundSync } from '@/hooks/use-background-sync';
import { type SyncStats } from '@/lib/types/sync';

interface SyncContextType {
  stats: SyncStats;
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { stats, isOnline } = useBackgroundSync();

  return (
    <SyncContext.Provider value={{ stats, isOnline }}>
      {children}
    </SyncContext.Provider>
  );
} 