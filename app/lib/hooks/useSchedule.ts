/**
 * Schedule Hook
 * Last Updated: 2024-01-15
 * 
 * Custom hook for fetching and managing schedule data.
 */

'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { toDomainSchedule } from '@/lib/database/mappers/schedule'

const supabase = createClient()

export function useSchedule(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/schedules/${id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return toDomainSchedule(data)
    }
  )

  return {
    schedule: data,
    error,
    isLoading,
    mutate
  }
} 