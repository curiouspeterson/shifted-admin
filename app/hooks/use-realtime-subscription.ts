/**
 * Realtime Subscription Hook
 * Last Updated: 2025-03-19
 * 
 * A custom hook for handling realtime subscriptions with proper typing,
 * error handling, retry logic, and performance optimizations.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload,
  RealtimePostgresEvent,
  RealtimeChannelOptions,
  RealtimeSystemStatus
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/types'

// Constants
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const DEBUG = process.env.NODE_ENV === 'development'

// Types
export type SubscriptionEvent = RealtimePostgresEvent
export type SubscriptionStatus = RealtimeSystemStatus['type']

export interface SubscriptionFilter {
  event?: SubscriptionEvent
  schema?: string
  table: keyof Tables
  filter?: string
}

export interface SubscriptionOptions<T> {
  onInsert?: (payload: T) => void
  onUpdate?: (payload: T) => void
  onDelete?: (payload: T) => void
  onError?: (error: SubscriptionError) => void
  onReconnect?: () => void
}

export interface SubscriptionState {
  isConnected: boolean
  error: SubscriptionError | null
  retryCount: number
  isReconnecting: boolean
}

// Error types
export class SubscriptionError extends Error {
  constructor(
    message: string, 
    public code: 'CHANNEL_ERROR' | 'TIMEOUT' | 'UNKNOWN' = 'UNKNOWN',
    public details?: unknown
  ) {
    super(message)
    this.name = 'SubscriptionError'
  }
}

/**
 * Custom hook for realtime subscriptions with retry logic and enhanced error handling
 * @template T - The type of data being subscribed to
 * @param filter - Configuration for the subscription filter
 * @param options - Handlers and options for the subscription
 * @returns Current state of the subscription
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>(
  filter: SubscriptionFilter,
  options: SubscriptionOptions<T>
): SubscriptionState {
  // Memoize initial state
  const initialState = useMemo<SubscriptionState>(() => ({
    isConnected: false,
    error: null,
    retryCount: 0,
    isReconnecting: false
  }), [])

  const [state, setState] = useState<SubscriptionState>(initialState)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<number | null>(null)

  // Debug logging
  const log = useCallback((message: string, ...args: unknown[]) => {
    if (DEBUG) {
      console.log(`[Realtime Subscription] ${message}`, ...args)
    }
  }, [])

  // Optimized cleanup with error handling
  const cleanup = useCallback(() => {
    try {
      if (channelRef.current) {
        log('Cleaning up subscription')
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    } catch (err) {
      log('Error during cleanup:', err)
    } finally {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [log])

  // Enhanced error handling with type discrimination
  const handleError = useCallback((error: Error | SubscriptionError) => {
    log('Error occurred:', error)
    const subscriptionError = error instanceof SubscriptionError 
      ? error 
      : new SubscriptionError(error.message)
    
    setState(prev => ({ ...prev, error: subscriptionError }))
    options.onError?.(subscriptionError)
  }, [options, log])

  // Optimized reconnection logic
  const attemptReconnect = useCallback(() => {
    log('Attempting reconnection')
    setState(prev => ({ 
      ...prev, 
      isReconnecting: true,
      retryCount: prev.retryCount + 1,
      error: null // Clear error on retry
    }))
    
    cleanup()
    options.onReconnect?.()
    
    retryTimeoutRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, isReconnecting: false }))
    }, RETRY_DELAY * Math.min(state.retryCount + 1, 3)) // Exponential backoff
  }, [cleanup, options, state.retryCount, log])

  useEffect(() => {
    const {
      event = '*',
      schema = 'public',
      table,
      filter: filterString,
    } = filter

    log('Setting up subscription', { table, event, schema })

    // Create the channel with error handling
    try {
      const channel = supabase.channel(`${table}_changes`)
      
      // Configure the subscription
      const channelOptions: RealtimeChannelOptions = {
        event,
        schema,
        table: table as string,
        filter: filterString ?? undefined
      }

      const subscription = channel.on(
        'postgres_changes',
        channelOptions,
        (payload: RealtimePostgresChangesPayload<T>) => {
          try {
            log('Received payload', payload.eventType)
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
            const error = err instanceof Error 
              ? new SubscriptionError(err.message, 'UNKNOWN', err)
              : new SubscriptionError('Unknown error in subscription handler')
            handleError(error)
          }
        }
      )

      // Subscribe to connection status with enhanced error handling
      subscription.on('system', (status: RealtimeSystemStatus) => {
        log('System status changed', status.type)
        switch (status.type) {
          case 'SUBSCRIBED':
            setState(prev => ({ 
              ...prev, 
              isConnected: true,
              error: null,
              retryCount: 0 
            }))
            break
            
          case 'CLOSED':
            setState(prev => ({ ...prev, isConnected: false }))
            break
            
          case 'CHANNEL_ERROR':
            const channelError = status.error 
              ? new SubscriptionError(status.error.message, 'CHANNEL_ERROR', status.error)
              : new SubscriptionError('Channel error occurred', 'CHANNEL_ERROR')
            handleError(channelError)
            
            if (state.retryCount < MAX_RETRIES) {
              attemptReconnect()
            }
            break
            
          case 'TIMED_OUT':
            const timeoutError = new SubscriptionError(
              'Channel connection timed out',
              'TIMEOUT',
              { retryCount: state.retryCount }
            )
            handleError(timeoutError)
            
            if (state.retryCount < MAX_RETRIES) {
              attemptReconnect()
            }
            break
        }
      })

      // Subscribe to the channel
      channelRef.current = channel.subscribe()
    } catch (err) {
      const error = err instanceof Error
        ? new SubscriptionError(err.message, 'UNKNOWN', err)
        : new SubscriptionError('Failed to setup subscription')
      handleError(error)
    }

    // Cleanup on unmount or filter/options change
    return cleanup
  }, [filter, options, handleError, cleanup, attemptReconnect, state.retryCount, log])

  return state
} 