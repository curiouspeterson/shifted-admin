/**
 * Offline Data Hook
 * Last Updated: 2025-01-17
 * 
 * Custom hook for managing offline data storage and synchronization
 */

import { useCallback, useEffect, useState } from 'react';
import { DatabaseError } from '@/lib/errors';
import type { Database } from '@/lib/supabase/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

interface OfflineData<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  lastSynced: Date | null;
}

interface UseOfflineDataOptions {
  key: string;
  syncInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export function useOfflineData<T extends keyof Database['public']['Tables']>(
  tableName: T,
  options: UseOfflineDataOptions
): OfflineData<TableRow<T>> {
  const [state, setState] = useState<OfflineData<TableRow<T>>>({
    data: null,
    isLoading: true,
    error: null,
    lastSynced: null
  });

  const syncData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Attempt to fetch from IndexedDB first
      const offlineStore = await openIndexedDB();
      const localData = await offlineStore.getAll<TableRow<T>>(tableName);
      
      if (localData) {
        setState(prev => ({
          ...prev,
          data: localData,
          isLoading: false,
          lastSynced: new Date()
        }));
      }
      
      // Attempt to sync with server if online
      if (navigator.onLine) {
        const response = await fetch(`/api/${tableName}`);
        if (!response.ok) {
          throw new DatabaseError('Failed to fetch data from server');
        }
        
        const serverData = (await response.json()) as TableRow<T>[];
        await offlineStore.setAll(tableName, serverData);
        
        setState(prev => ({
          ...prev,
          data: serverData,
          isLoading: false,
          lastSynced: new Date()
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      }));
    }
  }, [tableName]);

  useEffect(() => {
    void syncData();
    
    const syncInterval = setInterval(() => {
      void syncData();
    }, options.syncInterval ?? 300000); // Default to 5 minutes
    
    const handleOnline = () => {
      void syncData();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncData, options.syncInterval]);

  return state;
}

async function openIndexedDB() {
  // Implementation of IndexedDB opening logic
  // This is just a placeholder - the actual implementation would be more complex
  return {
    getAll: async <T>(storeName: string): Promise<T[]> => {
      // Implementation
      return [];
    },
    setAll: async <T>(storeName: string, data: T[]): Promise<void> => {
      // Implementation
    }
  };
} 