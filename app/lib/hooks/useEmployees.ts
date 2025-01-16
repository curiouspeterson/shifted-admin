/**
 * Employee Hook
 * Last Updated: 2024-01-15
 * 
 * Custom hook for fetching and managing employee data.
 */

'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { toDomainEmployee } from '@/lib/database/mappers/employee'

const supabase = createClient()

const fetcher = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    throw error
  }

  return data.map(toDomainEmployee)
}

export function useEmployees() {
  const { data, error, isLoading, mutate } = useSWR('employees', fetcher)

  return {
    employees: data,
    error,
    isLoading,
    mutate
  }
} 