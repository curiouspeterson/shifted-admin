/**
 * Schedule Hooks
 * Last Updated: 2024-03
 * 
 * Custom hooks for fetching and managing schedules.
 * Provides type-safe access to schedule data with loading and error states.
 */

import { useQuery } from './use-query';
import { supabase } from '@/lib/supabase/client';
import type { Schedule } from '@/lib/schemas';

/**
 * Use Schedule
 * Fetches a single schedule by ID
 */
export function useSchedule(id: string) {
  return useQuery<Schedule>(async () => {
    return await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();
  });
}

/**
 * Use Schedules
 * Fetches all schedules with optional filters
 */
export function useSchedules(filters?: {
  status?: Schedule['status'];
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<Schedule[]>(async () => {
    let query = supabase
      .from('schedules')
      .select('*')
      .order('start_date', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('end_date', filters.endDate);
    }

    return await query;
  });
}

/**
 * Use Create Schedule
 * Creates a new schedule
 */
export async function createSchedule(
  data: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
) {
  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

/**
 * Use Update Schedule
 * Updates an existing schedule
 */
export async function updateSchedule(
  id: string,
  data: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
) {
  const { data: schedule, error } = await supabase
    .from('schedules')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

/**
 * Use Delete Schedule
 * Deletes a schedule by ID
 */
export async function deleteSchedule(id: string) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 