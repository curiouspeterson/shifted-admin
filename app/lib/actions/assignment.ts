/**
 * Assignment Actions
 * Last Updated: 2024-03-21
 * 
 * Server actions for managing schedule assignments.
 * Uses database types directly to ensure type safety.
 */

'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../database/database.types';
import type { AssignmentFormData } from '../schemas/forms';

type Assignment = Database['public']['Tables']['schedule_assignments']['Row'];
type AssignmentInsert = Database['public']['Tables']['schedule_assignments']['Insert'];

export type AssignmentResponse = {
  data: Assignment | null;
  error?: string;
};

export async function createAssignment(formData: AssignmentFormData): Promise<AssignmentResponse> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Check for existing assignment
    const { data: existing } = await supabase
      .from('schedule_assignments')
      .select()
      .eq('schedule_id', formData.schedule_id)
      .eq('employee_id', formData.employee_id)
      .eq('date', formData.date)
      .single();

    if (existing) {
      return { data: null, error: 'Assignment already exists for this employee on this date' };
    }

    // Get shift details
    const { data: shift } = await supabase
      .from('shifts')
      .select('start_time, end_time')
      .eq('id', formData.shift_id)
      .single();

    if (!shift) {
      return { data: null, error: 'Shift not found' };
    }

    // Create assignment with shift times
    const assignmentData: AssignmentInsert = {
      schedule_id: formData.schedule_id,
      employee_id: formData.employee_id,
      shift_id: formData.shift_id,
      date: formData.date,
      is_supervisor_shift: formData.is_supervisor_shift,
      overtime_hours: formData.overtime_hours,
      overtime_status: formData.overtime_status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: formData.created_by,
      updated_by: formData.updated_by,
      version: formData.version
    };

    const { data: newAssignment, error } = await supabase
      .from('schedule_assignments')
      .insert([assignmentData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return { data: null, error: error.message };
    }

    if (!newAssignment) {
      return { data: null, error: 'Failed to create assignment' };
    }

    return { data: newAssignment };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return { data: null, error: 'Failed to create assignment' };
  }
}