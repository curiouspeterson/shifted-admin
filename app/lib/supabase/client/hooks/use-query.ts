/**
 * Supabase Query Hook
 * Last Updated: 2024-03-21
 * 
 * Type-safe query hook for Supabase using SWR.
 * This hook provides a convenient way to fetch data from Supabase
 * with proper caching, revalidation, and error handling.
 */

import useSWR from 'swr'
import { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '..'
import { Database } from '../../types/database'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

interface QueryOptions<T extends TableName> {
  select?: keyof Tables[T]['Row'] | '*'
  filter?: {
    column: keyof Tables[T]['Row']
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'
    value: any
  }[]
  order?: {
    column: keyof Tables[T]['Row']
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

interface QueryResult<T> {
  data: T[] | null
  error: PostgrestError | null
  isLoading: boolean
  isValidating: boolean
  mutate: () => void
}

/**
 * Hook for querying Supabase tables with type safety
 */
export function useQuery<T extends TableName>(
  table: T,
  options: QueryOptions<T> = {}
): QueryResult<Tables[T]['Row']> {
  const {
    select = '*',
    filter = [],
    order,
    limit,
    offset,
  } = options

  const fetcher = async () => {
    try {
      let query = supabase
        .from(table)
        .select(select as string)

      // Apply filters
      filter.forEach(({ column, operator, value }) => {
        switch (operator) {
          case 'eq':
            query = query.eq(column as string, value)
            break
          case 'neq':
            query = query.neq(column as string, value)
            break
          case 'gt':
            query = query.gt(column as string, value)
            break
          case 'gte':
            query = query.gte(column as string, value)
            break
          case 'lt':
            query = query.lt(column as string, value)
            break
          case 'lte':
            query = query.lte(column as string, value)
            break
          case 'like':
            query = query.like(column as string, value)
            break
          case 'ilike':
            query = query.ilike(column as string, value)
            break
        }
      })

      // Apply ordering
      if (order) {
        query = query.order(order.column as string, {
          ascending: order.ascending ?? true,
        })
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit)
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Query error:', error)
      throw error
    }
  }

  const { data, error, isLoading, isValidating, mutate } = useSWR<Tables[T]['Row'][]>(
    // Create a unique key based on the query parameters
    [table, select, filter, order, limit, offset],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
} 