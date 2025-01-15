/**
 * Assignment Hooks
 * Last Updated: 2024-03
 * 
 * Custom hooks for fetching and managing assignments.
 * Provides type-safe access to assignment data with loading and error states.
 */

import { useQuery } from './use-query';
import { supabase } from '@/lib/supabase/client';
import type { Assignment } from '@/lib/schemas';

/**
 * Use Assignment
 * Fetches a single assignment by ID
 */
export function useAssignment(id: string) {
  return useQuery<Assignment>(async () => {
    return await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();
  });
}

/**
 * Use Schedule Assignments
 * Fetches all assignments for a specific schedule
 */
export function useScheduleAssignments(scheduleId: string, filters?: {
  employeeId?: string;
  date?: string;
}) {
  return useQuery<Assignment[]>(async () => {
    let query = supabase
      .from('assignments')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true });

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters?.date) {
      query = query.eq('date', filters.date);
    }

    return await query;
  });
}

/**
 * Use Create Assignment
 * Creates a new assignment
 */
export async function createAssignment(
  data: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
) {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return assignment;
}

/**
 * Use Update Assignment
 * Updates an existing assignment
 */
export async function updateAssignment(
  id: string,
  data: Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
) {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return assignment;
}

/**
 * Use Delete Assignment
 * Deletes an assignment by ID
 */
export async function deleteAssignment(id: string) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 