/**
 * Query Hook
 * Last Updated: 2024-03
 * 
 * A base hook for handling data fetching with loading and error states.
 * This hook provides a consistent pattern for data fetching across the application.
 */

import { useState, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
  isLoading: boolean;
  isError: boolean;
  mutate: () => Promise<void>;
}

interface QueryOptions {
  enabled?: boolean;
}

export function useQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: QueryOptions = {}
): QueryResult<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await queryFn();
      
      if (error) {
        setError(error);
        setData(null);
      } else {
        setError(null);
        setData(data);
      }
    } catch (err) {
      setError(err as PostgrestError);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [enabled]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    mutate: fetchData,
  };
} 