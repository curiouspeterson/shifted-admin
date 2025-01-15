/**
 * Shift Hooks
 * Last Updated: 2024-03
 * 
 * Custom hooks for fetching and managing shifts.
 * Provides type-safe access to shift data with loading and error states.
 */

import { useQuery } from './use-query';
import { supabase } from '@/lib/supabase/client';
import type { Shift } from '@/lib/schemas';

/**
 * Use Shift
 * Fetches a single shift by ID
 */
export function useShift(id: string) {
  return useQuery<Shift>(async () => {
    return await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .single();
  });
}

/**
 * Use Shifts
 * Fetches all shifts with optional filters
 */
export function useShifts(filters?: {
  isActive?: boolean;
  requiresSupervisor?: boolean;
}) {
  return useQuery<Shift[]>(async () => {
    let query = supabase
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.requiresSupervisor !== undefined) {
      query = query.eq('requires_supervisor', filters.requiresSupervisor);
    }

    return await query;
  });
}

/**
 * Use Create Shift
 * Creates a new shift
 */
export async function createShift(
  data: Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
) {
  const { data: shift, error } = await supabase
    .from('shifts')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return shift;
}

/**
 * Use Update Shift
 * Updates an existing shift
 */
export async function updateShift(
  id: string,
  data: Partial<Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
) {
  const { data: shift, error } = await supabase
    .from('shifts')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return shift;
}

/**
 * Use Delete Shift
 * Soft deletes a shift by setting is_active to false
 */
export async function deleteShift(id: string) {
  const { data: shift, error } = await supabase
    .from('shifts')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return shift;
} 