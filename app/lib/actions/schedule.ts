/**
 * Schedule Actions
 * Last Updated: 2024
 * 
 * Server actions for managing schedules.
 * Includes:
 * - Creating schedules
 * - Updating schedules
 * - Publishing/unpublishing schedules
 * - Deleting schedules
 * - Fetching schedules with filters
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { cookies } from 'next/headers';

// Validation schemas
const scheduleSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_published: z.boolean().default(false),
});

const querySchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  sort: z.enum(['start_date', 'end_date', 'status', 'created_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type Schedule = z.infer<typeof scheduleSchema>;
export type QueryParams = z.infer<typeof querySchema>;

/**
 * Create a new schedule
 */
export async function createSchedule(data: Schedule) {
  const supabase = createClient(cookies());
  const validated = scheduleSchema.parse(data);

  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert([validated])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`);
  }

  revalidatePath('/dashboard/schedules');
  return schedule;
}

/**
 * Get schedules with filters and pagination
 */
export async function getSchedules(params: Partial<QueryParams>) {
  const supabase = createClient(cookies());
  const { limit, offset, sort, order, status } = querySchema.parse(params);

  let query = supabase.from('schedules').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  if (sort) {
    query = query.order(sort, { ascending: order === 'asc' });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: schedules, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch schedules: ${error.message}`);
  }

  return schedules;
}

/**
 * Get a single schedule by ID
 */
export async function getSchedule(id: string) {
  const supabase = createClient(cookies());

  const { data: schedule, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch schedule: ${error.message}`);
  }

  return schedule;
}

/**
 * Update a schedule
 */
export async function updateSchedule(id: string, data: Partial<Schedule>) {
  const supabase = createClient(cookies());
  const validated = scheduleSchema.partial().parse(data);

  const { data: schedule, error } = await supabase
    .from('schedules')
    .update(validated)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update schedule: ${error.message}`);
  }

  revalidatePath(`/dashboard/schedules/${id}`);
  return schedule;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string) {
  const supabase = createClient(cookies());

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }

  revalidatePath('/dashboard/schedules');
}

/**
 * Publish a schedule
 */
export async function publishSchedule(id: string) {
  return updateSchedule(id, {
    status: 'published',
    is_published: true,
  });
}

/**
 * Unpublish a schedule
 */
export async function unpublishSchedule(id: string) {
  return updateSchedule(id, {
    status: 'draft',
    is_published: false,
  });
} 