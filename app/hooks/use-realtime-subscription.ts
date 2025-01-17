/**
 * Realtime Subscription Hook
 * Last Updated: 2025-03-19
 * 
 * A custom hook for handling realtime subscriptions with proper typing
 * and error handling.
 */

import { useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@/lib/types'

export type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE'
export type SubscriptionStatus = 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR'

export interface SubscriptionFilter {
  event?: SubscriptionEvent
  schema?: string
  table?: keyof Tables
  filter?: string
}

export interface SubscriptionOptions<T> {
  onInsert?: (payload: T) => void
  onUpdate?: (payload: T) => void
  onDelete?: (payload: T) => void
  onError?: (error: Error) => void
}

/**
 * Custom hook for realtime subscriptions
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  filter: SubscriptionFilter,
  options: SubscriptionOptions<T>
): { isConnected: boolean; error: Error | null } {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const {
      event = '*',
      schema = 'public',
      table,
      filter: filterString,
    } = filter

    if (!table) {
      setError(new Error('Table name is required'))
      return
    }

    // Create the channel
    const channel = supabase.channel(`${table}_changes`)

    // Configure the subscription
    const subscription = channel.on(
      'postgres_changes',
      {
        event,
        schema,
        table: table as string,
        filter: filterString,
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        try {
          switch (payload.eventType) {
            case 'INSERT':
              options.onInsert?.(payload.new)
              break
            case 'UPDATE':
              options.onUpdate?.(payload.new)
              break
            case 'DELETE':
              options.onDelete?.(payload.old as T)
              break
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error in subscription handler')
          setError(error)
          options.onError?.(error)
        }
      }
    )

    // Subscribe to connection status
    subscription
      .on('connected', () => setIsConnected(true))
      .on('disconnected', () => setIsConnected(false))
      .on('error', (err: Error) => {
        setError(err)
        options.onError?.(err)
      })

    // Subscribe to the channel
    channelRef.current = channel.subscribe((status: SubscriptionStatus) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    })

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [filter, options])

  return { isConnected, error }
} 