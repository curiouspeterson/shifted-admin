/**
 * Schedule Form Schema Module
 * Last Updated: 2024-03
 * 
 * Defines form validation schemas for schedule-related forms.
 * These schemas extend the base schedule schema but are specifically
 * tailored for form validation, omitting server-controlled fields.
 */

import { z } from 'zod';
import { scheduleStatusSchema } from '../base/schedule';

/**
 * Schedule Form Schema
 * Used for validating schedule creation/update forms
 */
export const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status: scheduleStatusSchema,
});

/**
 * Schedule Form Data Type
 * TypeScript type for schedule form data
 */
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>; 