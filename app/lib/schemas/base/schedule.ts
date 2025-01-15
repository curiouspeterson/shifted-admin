/**
 * Schedule Schema Module
 * Last Updated: 2024-03
 * 
 * Defines the base schema for schedule entities.
 * This schema represents the core data structure of a schedule
 * and is used as the foundation for derived schemas (forms, API, etc).
 */

import { z } from 'zod';

/**
 * Schedule Status
 * Defines the possible states of a schedule
 */
export const scheduleStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ScheduleStatus = z.infer<typeof scheduleStatusSchema>;

/**
 * Base Schedule Schema
 * Core schema for schedule entities
 */
export const scheduleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status: scheduleStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
});

/**
 * Schedule Type
 * TypeScript type inferred from the schedule schema
 */
export type Schedule = z.infer<typeof scheduleSchema>; 