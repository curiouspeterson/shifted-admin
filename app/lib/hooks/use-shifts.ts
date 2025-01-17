/**
 * useShifts Hook
 * Last Updated: 2024-01-16
 * 
 * Custom hook for fetching and managing shift data
 */

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../database/database.types';

type Shift = Database['public']['Tables']['shifts']['Row'];

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchShifts() {
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .order('start_time', { ascending: true });

        if (error) throw error;
        setShifts(data || []);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchShifts();
  }, [supabase]);

  return { shifts, isLoading, error };
} 