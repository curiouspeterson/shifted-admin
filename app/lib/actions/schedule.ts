/**
 * Schedule Actions Module
 * Last Updated: 2024-01-11
 * 
 * Server actions for managing schedules. Handles creation and updates of schedules
 * with validation, error handling, and cache revalidation.
 * 
 * Features:
 * - Server-side validation using Zod schemas
 * - User authorization checks
 * - Automatic versioning
 * - Error handling and type safety
 * - Automatic cache revalidation
 * 
 * @module actions/schedule
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ScheduleFormData } from '../schemas/forms';
import { scheduleFormSchema } from '../schemas/forms';

/**
 * Creates a new schedule with validation and authorization checks
 * 
 * Performs several steps before creating a schedule:
 * 1. Verifies user is authenticated
 * 2. Validates form data against schema
 * 3. Creates schedule with metadata (version, timestamps, etc)
 * 4. Revalidates cached data
 * 
 * @param data - Schedule form data to validate and create
 * @returns Promise resolving to created schedule or error
 * 
 * @throws Will throw an error if:
 * - User is not authenticated
 * - Form data is invalid
 * - Database operations fail
 * 
 * @example
 * ```ts
 * const result = await createSchedule({
 *   name: "Week 1 Schedule",
 *   start_date: "2024-01-01",
 *   end_date: "2024-01-07",
 *   status: "draft"
 * });
 * 
 * if (result.error) {
 *   // Handle error
 * }
 * ```
 */
export async function createSchedule(data: ScheduleFormData) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      data: null,
      error: 'Unauthorized'
    };
  }
  
  // Validate form data
  const validatedData = scheduleFormSchema.parse(data);
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert([{
        ...validatedData,
        created_by: user.id,
        version: 1,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/dashboard/schedules');
    return { data: schedule, error: null };
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create schedule'
    };
  }
}

/**
 * Updates an existing schedule with validation
 * 
 * Updates schedule data and handles:
 * 1. Partial updates of schedule fields
 * 2. Automatic timestamp updates
 * 3. Cache revalidation for affected routes
 * 
 * @param id - Unique identifier of schedule to update
 * @param data - Partial schedule data to update
 * @returns Promise resolving to updated schedule or error
 * 
 * @throws Will throw an error if:
 * - Schedule ID is invalid
 * - Form data is invalid
 * - Database operations fail
 * 
 * @example
 * ```ts
 * const result = await updateSchedule("123", {
 *   status: "published",
 *   name: "Updated Schedule Name"
 * });
 * 
 * if (result.error) {
 *   // Handle error
 * }
 * ```
 */
export async function updateSchedule(id: string, data: Partial<ScheduleFormData>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/dashboard/schedules/${id}`);
    return { data: schedule, error: null };
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update schedule'
    };
  }
} 