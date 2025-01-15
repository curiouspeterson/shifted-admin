/**
 * Supabase Client Hooks
 * Last Updated: 2024-03
 * 
 * This file provides custom React hooks for interacting with Supabase
 * on the client side. These hooks handle authentication, real-time subscriptions,
 * and data fetching with proper TypeScript types.
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  type Session, 
  type User, 
  type RealtimeChannel,
  type RealtimePostgresChangesPayload
} from '@supabase/supabase-js'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { createClient } from '../client'
import type { Database } from '../database.types'
import { SupabaseError } from '../utils'

const supabase = createClient()

/**
 * Hook to access the current authenticated user's session
 * @returns Object containing the current session, user, and loading state
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to get session'))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading, error }
}

/**
 * Type for real-time subscription payload
 */
export type RealtimePayload<T> = {
  new: T
  old: T | null
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
type SubscriptionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'

/**
 * Hook to subscribe to real-time changes on a table
 */
export function useRealtimeSubscription<
  TableName extends keyof Database['public']['Tables']
>(
  table: TableName,
  callback: (payload: RealtimePayload<Database['public']['Tables'][TableName]['Row']>) => void,
  options: {
    event?: RealtimeEvent
    filter?: string
  } = {}
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Type assertion for the channel configuration
    type ChannelConfig = {
      event: string
      schema: string
      table: string
      filter?: string
    }

    const config: ChannelConfig = {
      event: options.event || '*',
      schema: 'public',
      table: table as string,
      filter: options.filter,
    }

    const channel = supabase
      .channel(`table_changes_${table}`)
      // @ts-ignore - Supabase types don't properly handle the channel event type
      .on('postgres_changes', config, (payload) => {
        callback({
          new: payload.new as Database['public']['Tables'][TableName]['Row'],
          old: payload.old as Database['public']['Tables'][TableName]['Row'] | null,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        })
      })
      .subscribe((status: SubscriptionStatus) => {
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Failed to establish real-time connection'))
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [table, callback, options.event, options.filter])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }, [])

  return { error, unsubscribe }
}

/**
 * Configuration options for the useQuery hook
 */
export interface QueryOptions {
  refetchInterval?: number
  retryCount?: number
  retryDelay?: number
}

/**
 * Hook to fetch data from a table with automatic type inference
 */
export function useQuery<
  TableName extends keyof Database['public']['Tables']
>(
  table: TableName,
  query?: (
    queryBuilder: PostgrestFilterBuilder<
      Database['public'],
      Database['public']['Tables'][TableName]['Row'],
      Database['public']['Tables'][TableName]['Row'][]
    >
  ) => PostgrestFilterBuilder<
    Database['public'],
    Database['public']['Tables'][TableName]['Row'],
    Database['public']['Tables'][TableName]['Row'][]
  >,
  options: QueryOptions = {}
) {
  type Row = Database['public']['Tables'][TableName]['Row']
  const [data, setData] = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      let queryBuilder = supabase
        .from(table)
        .select('*') as PostgrestFilterBuilder<
        Database['public'],
        Row,
        Row[]
      >

      if (query) {
        queryBuilder = query(queryBuilder)
      }

      const { data: result, error: queryError } = await queryBuilder

      if (queryError) throw queryError
      setData(result)
      setError(null)
      setRetryCount(0)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)

      if (retryCount < (options.retryCount ?? 3)) {
        setTimeout(() => {
          setRetryCount(count => count + 1)
        }, (options.retryDelay ?? 1000) * Math.pow(2, retryCount))
      }
    } finally {
      setLoading(false)
    }
  }, [table, query, options.retryCount, options.retryDelay, retryCount])

  useEffect(() => {
    let mounted = true
    let intervalId: NodeJS.Timeout | undefined

    if (mounted) {
      fetchData()
    }

    if (options.refetchInterval) {
      intervalId = setInterval(fetchData, options.refetchInterval)
    }

    return () => {
      mounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [fetchData, options.refetchInterval])

  const refetch = useCallback(() => {
    setLoading(true)
    return fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
} 