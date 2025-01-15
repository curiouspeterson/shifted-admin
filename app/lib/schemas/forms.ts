/**
 * Forms Schema Module
 * Last Updated: 2024
 * 
 * Defines Zod schemas for form validation in the application.
 * These schemas are used to validate user input in forms for creating
 * and updating schedules and assignments. They extend the base schemas
 * but omit server-controlled fields and add form-specific validations.
 * 
 * Features:
 * - Schedule form validation
 * - Assignment form validation
 * - Form error handling
 * - Type inference helpers
 */

import { z } from 'zod';
import { scheduleSchema, assignmentSchema } from './schedule';

/**
 * Schedule Form Schema
 * Extends the base schedule schema for form validation.
 * Omits server-controlled fields and adds form-specific fields.
 * 
 * Required fields:
 * - name: Schedule name (min 1 character)
 * - start_date: Start date in YYYY-MM-DD format
 * - end_date: End date in YYYY-MM-DD format
 * - status: Schedule status (draft/published/archived)
 * 
 * Optional fields:
 * - description: Schedule description
 */
export const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status: z.enum(['draft', 'published', 'archived']),
});

/**
 * Assignment Form Schema
 * Extends the base assignment schema for form validation.
 * Omits server-controlled fields and adds form-specific validations.
 * 
 * Required fields:
 * - schedule_id: UUID of the schedule
 * - employee_id: UUID of the assigned employee
 * - shift_id: UUID of the assigned shift
 * - date: Assignment date in YYYY-MM-DD format
 * - is_supervisor_shift: Whether this is a supervisor shift
 * 
 * Optional fields:
 * - overtime_hours: Number of overtime hours (nullable)
 * - overtime_status: Status of overtime request (nullable)
 */
export const assignmentFormSchema = z.object({
  schedule_id: z.string().uuid('Invalid schedule ID'),
  employee_id: z.string().uuid('Invalid employee ID'),
  shift_id: z.string().uuid('Invalid shift ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  is_supervisor_shift: z.boolean(),
  overtime_hours: z.number().min(0).nullable(),
  overtime_status: z.enum(['none', 'pending', 'approved', 'rejected']).nullable(),
});

/**
 * Type Inference
 * Helper types inferred from the Zod schemas for use in form components
 */
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

/**
 * Form Error Schema
 * Defines the structure of form validation errors
 * 
 * @property message - Main error message
 * @property errors - Optional record of field-specific error messages
 */
export const formErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string()).optional(),
}); 