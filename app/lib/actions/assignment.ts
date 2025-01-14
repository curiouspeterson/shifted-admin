/**
 * Assignment Actions Module
 * Last Updated: 2024-01-11
 * 
 * Server actions for managing schedule assignments. Handles creation and updates
 * of employee shift assignments with validation and conflict checking.
 * 
 * Features:
 * - Server-side validation using Zod schemas
 * - Supervisor requirement validation
 * - Shift overlap detection
 * - Error handling and type safety
 * - Automatic cache revalidation
 * 
 * @module actions/assignment
 */

'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';
import type { AssignmentFormData } from '../schemas/forms';
import { assignmentFormSchema } from '../schemas/forms';

/**
 * Creates a new schedule assignment with validation checks
 * 
 * Performs several validation steps before creating an assignment:
 * 1. Validates form data against schema
 * 2. Checks if shift requires a supervisor
 * 3. Verifies employee is a supervisor if required
 * 4. Checks for overlapping assignments
 * 
 * @param data - Assignment form data to validate and create
 * @returns Promise resolving to created assignment or error
 * 
 * @throws Will throw an error if:
 * - Form data is invalid
 * - Shift requires supervisor but employee isn't one
 * - Assignment overlaps with existing assignments
 * - Database operations fail
 * 
 * @example
 * ```ts
 * const result = await createAssignment({
 *   schedule_id: "123",
 *   employee_id: "456",
 *   shift_id: "789",
 *   date: "2024-01-15"
 * });
 * 
 * if (result.error) {
 *   // Handle error
 * }
 * ```
 */
export async function createAssignment(data: AssignmentFormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Validate form data
  const validatedData = assignmentFormSchema.parse(data);
  
  try {
    // First, check if the shift requires a supervisor
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('requires_supervisor')
      .eq('id', validatedData.shift_id)
      .single();

    if (shiftError) {
      throw new Error(shiftError.message);
    }

    // If the shift requires a supervisor, verify the employee is a supervisor
    if (shift.requires_supervisor) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('position')
        .eq('id', validatedData.employee_id)
        .single();

      if (employeeError) {
        throw new Error(employeeError.message);
      }

      if (employee.position !== 'supervisor') {
        throw new Error('This shift requires a supervisor');
      }
    }

    // Check for overlapping assignments
    const { data: existingAssignments, error: overlapError } = await supabase
      .from('schedule_assignments')
      .select(`
        id,
        shift:shifts (
          start_time,
          end_time
        )
      `)
      .eq('employee_id', validatedData.employee_id)
      .eq('date', validatedData.date);

    if (overlapError) {
      throw new Error(overlapError.message);
    }

    // Get the new shift times
    const { data: newShift, error: newShiftError } = await supabase
      .from('shifts')
      .select('start_time, end_time')
      .eq('id', validatedData.shift_id)
      .single();

    if (newShiftError) {
      throw new Error(newShiftError.message);
    }

    // Check for overlaps
    const hasOverlap = existingAssignments.some(assignment => {
      const existingShift = assignment.shift;
      if (!existingShift) return false;

      const start1 = existingShift.start_time;
      const end1 = existingShift.end_time;
      const start2 = newShift.start_time;
      const end2 = newShift.end_time;

      // Convert times to minutes for comparison
      const [start1Hour, start1Minute] = start1.split(':').map(Number);
      const [end1Hour, end1Minute] = end1.split(':').map(Number);
      const [start2Hour, start2Minute] = start2.split(':').map(Number);
      const [end2Hour, end2Minute] = end2.split(':').map(Number);

      const start1Minutes = start1Hour * 60 + start1Minute;
      const end1Minutes = end1Hour * 60 + end1Minute;
      const start2Minutes = start2Hour * 60 + start2Minute;
      const end2Minutes = end2Hour * 60 + end2Minute;

      return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
    });

    if (hasOverlap) {
      throw new Error('This assignment overlaps with an existing assignment');
    }

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .insert([{
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select(`
        *,
        employee:employees (*),
        shift:shifts (*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/dashboard/schedules/${validatedData.schedule_id}`);
    return { data: assignment, error: null };
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create assignment'
    };
  }
}

/**
 * Updates an existing schedule assignment
 * 
 * Modifies an assignment's details and handles cache invalidation.
 * Note: Does not perform the same validation checks as creation.
 * 
 * @param id - ID of the assignment to update
 * @param data - Partial assignment data to update
 * @returns Promise resolving to updated assignment or error
 * 
 * @throws Will throw an error if:
 * - Assignment doesn't exist
 * - Database update fails
 * 
 * @example
 * ```ts
 * const result = await updateAssignment("123", {
 *   shift_id: "newShiftId",
 *   overtime_hours: 2
 * });
 * 
 * if (result.error) {
 *   // Handle error
 * }
 * ```
 */
export async function updateAssignment(id: string, data: Partial<AssignmentFormData>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        employee:employees (*),
        shift:shifts (*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/dashboard/schedules/${assignment.schedule_id}`);
    return { data: assignment, error: null };
  } catch (error) {
    console.error('Failed to update assignment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update assignment'
    };
  }
} 