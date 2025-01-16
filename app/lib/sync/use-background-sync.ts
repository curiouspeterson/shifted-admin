/**
 * Background Sync Hook
 * Last Updated: 2024-01-15
 * 
 * React hook for using the background sync service in components.
 * Provides methods to queue operations and monitor sync status.
 */

import { useCallback, useEffect, useState } from 'react'
import { Database } from '@/lib/database/database.types'
import { BackgroundSyncService, SyncStats } from './background-sync-service'
import { LocalSyncStorage } from './local-storage'
import { useSupabase } from '@/lib/supabase/provider'

// Type for the sync status
export type SyncStatus = {
  isOnline: boolean
  isSyncing: boolean
  stats: SyncStats
  lastError: string | null
}

// Default sync status
const defaultStatus: SyncStatus = {
  isOnline: true,
  isSyncing: false,
  stats: {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    lastSync: null,
    lastError: null
  },
  lastError: null
}

// Singleton instance of the sync service
let syncService: BackgroundSyncService | null = null

/**
 * Hook for using the background sync service
 */
export function useBackgroundSync() {
  const { supabase } = useSupabase()
  const [status, setStatus] = useState<SyncStatus>(defaultStatus)

  // Initialize the sync service
  useEffect(() => {
    if (!syncService && supabase) {
      const storage = new LocalSyncStorage()
      syncService = new BackgroundSyncService(supabase, storage)
      syncService.initialize().catch(console.error)
    }
  }, [supabase])

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }))
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Update sync stats periodically
  useEffect(() => {
    let mounted = true
    const interval = setInterval(async () => {
      if (!syncService) return

      try {
        const stats = await syncService.getStats()
        if (mounted) {
          setStatus(prev => ({
            ...prev,
            isSyncing: stats.processing > 0,
            stats,
            lastError: stats.lastError
          }))
        }
      } catch (error) {
        console.error('Failed to get sync stats', error)
      }
    }, 1000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  /**
   * Queue a create operation
   */
  const queueCreate = useCallback(async <T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized')
    }

    await syncService.addOperation('create', table, data)
  }, [])

  /**
   * Queue an update operation
   */
  const queueUpdate = useCallback(async <T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Update']
  ): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized')
    }

    if (!data.id) {
      throw new Error('Cannot queue update operation: missing id')
    }

    await syncService.addOperation('update', table, data)
  }, [])

  /**
   * Queue a delete operation
   */
  const queueDelete = useCallback(async <T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<void> => {
    if (!syncService) {
      throw new Error('Sync service not initialized')
    }

    await syncService.addOperation('delete', table, { id } as Database['public']['Tables'][T]['Row'])
  }, [])

  return {
    status,
    queueCreate,
    queueUpdate,
    queueDelete
  }
} 