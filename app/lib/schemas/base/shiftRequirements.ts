/**
 * Shift Requirements Schema Module
 * Last Updated: 2024-03-20
 * 
 * Defines the schema for shift staffing requirements.
 * This schema represents the staffing needs for a shift,
 * including minimum staff counts and supervisor requirements.
 */

import { z } from 'zod';

/**
 * Base Shift Requirements Schema
 * Core schema for shift staffing requirements
 */
export const shiftRequirementsSchema = z.object({
  id: z.string().uuid(),
  shift_id: z.string().uuid(),
  min_staff: z.number().int().min(1, 'Minimum staff count must be at least 1'),
  supervisor_required: z.boolean(),
  dispatcher_required: z.boolean().default(false),
  min_experience_years: z.number().min(0).default(0),
  special_certifications: z.array(z.string()).default([]),
  notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
});

/**
 * Shift Requirements Type
 * TypeScript type inferred from the shift requirements schema
 */
export type ShiftRequirements = z.infer<typeof shiftRequirementsSchema>;

/**
 * Shift Requirements Input Schema
 * Schema for creating/updating shift requirements
 */
export const shiftRequirementsInputSchema = shiftRequirementsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

/**
 * Shift Requirements Input Type
 * TypeScript type for shift requirements input
 */
export type ShiftRequirementsInput = z.infer<typeof shiftRequirementsInputSchema>; 