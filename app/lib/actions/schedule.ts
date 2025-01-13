'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';
import type { ScheduleFormData } from '../schemas/forms';
import { scheduleFormSchema } from '../schemas/forms';

export async function createSchedule(data: ScheduleFormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Validate form data
  const validatedData = scheduleFormSchema.parse(data);
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert([{
        ...validatedData,
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