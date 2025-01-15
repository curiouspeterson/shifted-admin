/**
 * Schedule Schema
 * Last Updated: 2024-03-20 02:20 PST
 * 
 * This file defines the schedule schema using Zod validation.
 */

import { z } from 'zod';

export const ScheduleStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type ScheduleStatus = typeof ScheduleStatus[keyof typeof ScheduleStatus];

export const scheduleInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum([ScheduleStatus.DRAFT, ScheduleStatus.PUBLISHED]).default(ScheduleStatus.DRAFT),
  is_active: z.boolean().default(true),
}).refine(
  (data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return start <= end;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
); 