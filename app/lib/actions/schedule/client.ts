/**
 * Schedule Client Actions
 * Last Updated: 2024-03-19 23:20 PST
 * 
 * Client-side wrappers for schedule server actions with error handling.
 */

'use client';

import { toast } from '@/components/ui/toast';
import { getUserMessage } from '@/lib/errors/utils';
import { AppError } from '@/lib/errors/base';
import { type ScheduleInput } from '@/lib/schemas/schedule';
import {
  createSchedule as createScheduleAction,
  getSchedules as getSchedulesAction,
  publishSchedule as publishScheduleAction,
  unpublishSchedule as unpublishScheduleAction,
} from './index';

/**
 * Create Schedule
 */
export async function createSchedule(data: ScheduleInput) {
  try {
    const schedule = await createScheduleAction(data);
    toast({
      title: 'Success',
      description: 'Schedule created successfully',
      variant: 'success',
    });
    return schedule;
  } catch (error) {
    const message = error instanceof AppError
      ? getUserMessage(error)
      : 'Failed to create schedule';

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });

    throw error;
  }
}

/**
 * Get Schedules
 */
export async function getSchedules(params?: Parameters<typeof getSchedulesAction>[0]) {
  try {
    return await getSchedulesAction(params);
  } catch (error) {
    const message = error instanceof AppError
      ? getUserMessage(error)
      : 'Failed to fetch schedules';

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });

    throw error;
  }
}

/**
 * Publish Schedule
 */
export async function publishSchedule(id: string) {
  try {
    const schedule = await publishScheduleAction(id);
    toast({
      title: 'Success',
      description: 'Schedule published successfully',
      variant: 'success',
    });
    return schedule;
  } catch (error) {
    const message = error instanceof AppError
      ? getUserMessage(error)
      : 'Failed to publish schedule';

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });

    throw error;
  }
}

/**
 * Unpublish Schedule
 */
export async function unpublishSchedule(id: string) {
  try {
    const schedule = await unpublishScheduleAction(id);
    toast({
      title: 'Success',
      description: 'Schedule unpublished successfully',
      variant: 'success',
    });
    return schedule;
  } catch (error) {
    const message = error instanceof AppError
      ? getUserMessage(error)
      : 'Failed to unpublish schedule';

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });

    throw error;
  }
} 