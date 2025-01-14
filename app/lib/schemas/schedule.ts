/**
 * Schedule Schema Module
 * Last Updated: 2024
 * 
 * Defines Zod schemas for validating schedule-related data structures.
 * Includes schemas for employees, shifts, assignments, time-based requirements,
 * and schedules, along with response schemas for API validation.
 * 
 * Features:
 * - Type-safe schema definitions
 * - Custom validation rules
 * - Response schema wrappers
 * - Type inference helpers
 */

import { z } from 'zod';

/**
 * Base Validation Schemas
 * Common schemas for primitive types used across multiple entities
 */

// Time string validation (HH:MM format)
const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: 'Time must be in 24-hour format (HH:MM)',
});

// Date string validation (YYYY-MM-DD format)
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
});

/**
 * Custom datetime schema that accepts both ISO and Postgres timestamp formats
 * Validates against both ISO 8601 and Postgres timestamp patterns
 */
const datetimeSchema = z.string().refine((value) => {
  // Accept ISO format and Postgres timestamp format
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/;
  const postgresPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/;
  return isoPattern.test(value) || postgresPattern.test(value);
}, {
  message: 'Invalid datetime format',
});

/**
 * Employee Schema
 * Validates employee data with required fields and format constraints
 */
export const employeeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().nullable(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').nullable(),
  phone: z.number().nullable(),
  position: z.string(),
  is_active: z.boolean().nullable(),
  created_at: datetimeSchema.nullable(),
  updated_at: datetimeSchema.nullable(),
});

/**
 * Shift Schema
 * Validates shift template data with time constraints and flags
 */
export const shiftSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Shift name is required'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)',
  }),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)',
  }),
  duration_hours: z.number().min(0, 'Duration must be positive'),
  crosses_midnight: z.boolean(),
  requires_supervisor: z.boolean(),
  created_at: datetimeSchema.nullable(),
  updated_at: datetimeSchema.nullable(),
});

/**
 * Assignment Schema
 * Validates shift assignments with employee and shift relationships
 */
export const assignmentSchema = z.object({
  id: z.string().uuid(),
  schedule_id: z.string().uuid().nullable(),
  employee_id: z.string().uuid().nullable(),
  shift_id: z.string().uuid().nullable(),
  date: dateStringSchema,
  is_supervisor_shift: z.boolean(),
  overtime_hours: z.number().nullable(),
  overtime_status: z.string().nullable(),
  created_at: datetimeSchema.nullable(),
  updated_at: datetimeSchema.nullable(),
  // Joined data
  employee: employeeSchema.nullable(),
  shift: shiftSchema.nullable(),
});

/**
 * Time-based Requirement Schema
 * Validates staffing requirements for specific time periods
 */
export const timeBasedRequirementSchema = z.object({
  id: z.string().uuid(),
  schedule_id: z.string().uuid(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)',
  }),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)',
  }),
  min_employees: z.number().int().min(0),
  max_employees: z.number().int().nullable(),
  min_supervisors: z.number().int().min(0).default(1),
  day_of_week: z.number().int().min(0).max(6),
  created_at: datetimeSchema.nullable(),
  updated_at: datetimeSchema.nullable(),
});

/**
 * Schedule Schema
 * Validates schedule data with status tracking and version control
 */
export const scheduleSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  created_at: datetimeSchema.nullable(),
  created_by: z.string().nullable(),
  published_at: datetimeSchema.nullable().optional(),
  published_by: z.string().nullable().optional(),
  version: z.number(),
  is_active: z.boolean(),
});

/**
 * Requirement Status Schema
 * Validates the status of staffing requirements
 */
export const requirementStatusSchema = z.object({
  timeBlock: z.object({
    startTime: timeStringSchema,
    endTime: timeStringSchema,
  }),
  requiredCount: z.number().int().min(0),
  assignedCount: z.number().int().min(0),
  isSatisfied: z.boolean(),
});

/**
 * Response Schemas
 * Wraps entity schemas in a standard API response format
 */
export const scheduleResponseSchema = z.object({
  data: scheduleSchema.nullable(),
  error: z.string().nullable(),
});

export const assignmentsResponseSchema = z.object({
  data: z.array(assignmentSchema),
  error: z.string().nullable(),
});

export const timeRequirementsResponseSchema = z.object({
  data: z.array(timeBasedRequirementSchema),
  error: z.string().nullable(),
});

/**
 * Type Inference
 * Helper types inferred from the Zod schemas
 */
export type ScheduleSchema = z.infer<typeof scheduleSchema>;
export type AssignmentSchema = z.infer<typeof assignmentSchema>;
export type TimeBasedRequirementSchema = z.infer<typeof timeBasedRequirementSchema>;
export type RequirementStatusSchema = z.infer<typeof requirementStatusSchema>; 