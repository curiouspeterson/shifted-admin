/**
 * Forms Schema Module
 * Last Updated: 2024-01-16
 * 
 * Defines Zod schemas for form validation in the application.
 * These schemas are used to validate user input in forms for creating
 * and updating schedules and assignments.
 */

import { z } from 'zod';

/**
 * Schedule Form Schema
 * Extends the base schedule schema for form validation.
 * Omits server-controlled fields and adds form-specific fields.
 */
export const scheduleFormSchema = z.object({
  title: z.string().min(1, 'Schedule title is required'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
}).refine((data) => {
  return data.endDate >= data.startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

/**
 * Assignment Form Schema
 * Extends the base assignment schema for form validation.
 * Omits server-controlled fields and adds form-specific validations.
 */
export const assignmentFormSchema = z.object({
  schedule_id: z.string(),
  employee_id: z.string().min(1, 'Employee is required'),
  shift_id: z.string().min(1, 'Shift is required'),
  date: z.string().min(1, 'Date is required'),
  is_supervisor_shift: z.boolean().default(false),
  overtime_hours: z.number().nullable().default(null),
  overtime_status: z.enum(['none', 'pending', 'rejected', 'approved']).nullable().default(null),
  created_by: z.string().nullable().default(null),
  updated_by: z.string().nullable().default(null),
  version: z.number().default(1)
});

/**
 * Assignment Response Schema
 * Defines the structure of assignment responses from the server
 */
export const assignmentResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    schedule_id: z.string(),
    employee_id: z.string(),
    shift_id: z.string(),
    date: z.string(),
    is_supervisor_shift: z.boolean().nullable(),
    overtime_hours: z.number().nullable(),
    overtime_status: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    created_by: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number()
  }).nullable(),
  error: z.string().optional()
});

/**
 * Type Inference
 * Helper types inferred from the Zod schemas for use in form components
 */
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
export type AssignmentResponse = z.infer<typeof assignmentResponseSchema>;

/**
 * Form Error Schema
 * Defines the structure of form validation errors
 */
export const formErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string()).optional(),
});