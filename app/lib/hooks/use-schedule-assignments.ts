/**
 * useScheduleAssignments Hook
 * Last Updated: 2024-01-16
 * 
 * Custom hook for fetching and managing schedule assignments
 */

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../database/database.types';

type Assignment = Database['public']['Tables']['schedule_assignments']['Row'];

export function useScheduleAssignments(scheduleId: string) {
  const [rawAssignments, setRawAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const { data, error } = await supabase
          .from('schedule_assignments')
          .select('*')
          .eq('schedule_id', scheduleId);

        if (error) throw error;
        setRawAssignments(data || []);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssignments();
  }, [scheduleId, supabase]);

  return { rawAssignments, isLoading, error };
} 