/**
 * useSchedule Hook
 * Last Updated: 2024-01-16
 * 
 * Custom hook for fetching and managing schedule data
 */

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../database/database.types';

type Schedule = Database['public']['Tables']['schedules']['Row'];

export function useSchedule(scheduleId: string) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', scheduleId)
          .single();

        if (error) throw error;
        setSchedule(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedule();
  }, [scheduleId, supabase]);

  return { schedule, isLoading, error };
} 