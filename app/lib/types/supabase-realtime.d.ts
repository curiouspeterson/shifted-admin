/**
 * Supabase Realtime Type Declarations
 * Last Updated: 2025-03-19
 * 
 * Type declarations to augment @supabase/supabase-js with proper
 * realtime subscription types.
 */

import type { 
  RealtimeChannel as BaseRealtimeChannel,
  RealtimePostgresChangesPayload
} from '@supabase/supabase-js'

declare module '@supabase/supabase-js' {
  type RealtimePostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  type RealtimeChannelEvent = 'postgres_changes' | 'presence' | 'broadcast' | 'system'
  
  interface RealtimeChannelOptions {
    event: RealtimePostgresEvent
    schema: string
    table: string
    filter?: string | undefined
  }

  interface RealtimeSystemStatus {
    type: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT'
    error?: Error
  }

  interface RealtimeChannel extends BaseRealtimeChannel {
    on<T extends Record<string, unknown>>(
      event: 'postgres_changes',
      options: RealtimeChannelOptions,
      callback: (payload: RealtimePostgresChangesPayload<T>) => void
    ): RealtimeChannel

    on(
      event: 'system',
      callback: (status: RealtimeSystemStatus) => void
    ): RealtimeChannel
  }
} 