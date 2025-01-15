/**
 * Shift Schema Module
 * Last Updated: 2024-03
 * 
 * Defines the base schema for shift entities.
 * This schema represents the core data structure of a shift
 * and is used as the foundation for derived schemas (forms, API, etc).
 */

import { z } from 'zod';

/**
 * Time Format Regex
 * Validates time strings in 24-hour format (HH:MM)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Base Shift Schema
 * Core schema for shift entities
 */
export const shiftSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Shift name is required'),
  start_time: z.string().regex(timeRegex, 'Time must be in 24-hour format (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Time must be in 24-hour format (HH:MM)'),
  requires_supervisor: z.boolean(),
  min_dispatchers: z.number().int().min(1),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
});

/**
 * Shift Type
 * TypeScript type inferred from the shift schema
 */
export type Shift = z.infer<typeof shiftSchema>; 