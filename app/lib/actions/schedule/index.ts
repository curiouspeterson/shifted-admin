/**
 * Schedule Actions Module
 * Last Updated: 2024-03-19 23:15 PST
 * 
 * Server actions for managing schedules. Includes operations for:
 * - Creating new schedules
 * - Fetching schedules with filtering and pagination
 * - Updating schedule status
 * - Publishing/unpublishing schedules
 */

'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/utils';
import { ErrorCodes } from '@/lib/errors/types';
import { ScheduleRepository } from '@/lib/database/repositories/schedule';
import { scheduleInputSchema, scheduleQuerySchema, type ScheduleInput } from '@/lib/schemas/schedule';

/**
 * Create Schedule
 * Creates a new schedule with the provided data
 */
export async function createSchedule(data: ScheduleInput) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const repository = new ScheduleRepository();
  
  try {
    // Validate input data
    const validated = scheduleInputSchema.parse(data);

    // Check for conflicts
    const existing = await repository.findByDateRange(
      validated.start_date,
      validated.end_date
    );

    if (existing.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to check for schedule conflicts',
        { cause: existing.error }
      );
    }

    if (existing.data && existing.data.length > 0) {
      throw createError(
        ErrorCodes.CONFLICT,
        'A schedule already exists for this time period',
        { existing: existing.data }
      );
    }

    // Create schedule
    const result = await repository.create({
      ...validated,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to create schedule',
        { cause: result.error }
      );
    }
    
    revalidatePath('/dashboard/schedules');
    return result.data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid schedule data',
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Get Schedules
 * Fetches schedules with optional filtering and pagination
 */
export async function getSchedules(params?: z.infer<typeof scheduleQuerySchema>) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const repository = new ScheduleRepository();
  
  try {
    const validated = scheduleQuerySchema.parse(params);
    const result = await repository.findMany({
      status: validated.status,
      start_date_gte: validated.start_date,
      end_date_lte: validated.end_date,
      is_active: validated.is_active,
      limit: validated.limit,
      offset: validated.offset,
      orderBy: validated.sort_by,
      orderDirection: validated.sort_order,
    });

    if (result.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch schedules',
        { cause: result.error }
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid query parameters',
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Publish Schedule
 * Updates a schedule's status to published
 */
export async function publishSchedule(id: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const repository = new ScheduleRepository();
  
  try {
    // Check if schedule exists
    const existing = await repository.findById(id);
    if (existing.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch schedule',
        { cause: existing.error }
      );
    }
    
    if (!existing.data) {
      throw createError(
        ErrorCodes.NOT_FOUND,
        `Schedule not found with id: ${id}`
      );
    }

    // Check if schedule is already published
    if (existing.data.status === 'published') {
      throw createError(
        ErrorCodes.INVALID_STATE,
        'Schedule is already published'
      );
    }

    // Update schedule
    const result = await repository.update(id, {
      status: 'published',
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to publish schedule',
        { cause: result.error }
      );
    }
    
    revalidatePath('/dashboard/schedules');
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw createError(
        ErrorCodes.SYSTEM_ERROR,
        'Failed to publish schedule',
        { cause: error }
      );
    }
    throw error;
  }
}

/**
 * Unpublish Schedule
 * Updates a schedule's status back to draft
 */
export async function unpublishSchedule(id: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const repository = new ScheduleRepository();
  
  try {
    // Check if schedule exists
    const existing = await repository.findById(id);
    if (existing.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch schedule',
        { cause: existing.error }
      );
    }
    
    if (!existing.data) {
      throw createError(
        ErrorCodes.NOT_FOUND,
        `Schedule not found with id: ${id}`
      );
    }

    // Check if schedule is published
    if (existing.data.status !== 'published') {
      throw createError(
        ErrorCodes.INVALID_STATE,
        'Schedule is not published'
      );
    }

    // Update schedule
    const result = await repository.update(id, {
      status: 'draft',
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw createError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to unpublish schedule',
        { cause: result.error }
      );
    }
    
    revalidatePath('/dashboard/schedules');
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw createError(
        ErrorCodes.SYSTEM_ERROR,
        'Failed to unpublish schedule',
        { cause: error }
      );
    }
    throw error;
  }
} 