import { z } from 'zod';

// Base schemas for primitive types
const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: 'Time must be in 24-hour format (HH:MM)',
});

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
});

// Custom datetime schema that accepts both ISO and Postgres timestamp formats
const datetimeSchema = z.string().refine((value) => {
  // Accept ISO format and Postgres timestamp format
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/;
  const postgresPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/;
  return isoPattern.test(value) || postgresPattern.test(value);
}, {
  message: 'Invalid datetime format',
});

// Employee schema
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

// Shift schema
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

// Assignment schema with joined data
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

// Time-based requirement schema
export const timeBasedRequirementSchema = z.object({
  id: z.string().uuid(),
  start_time: timeStringSchema,
  end_time: timeStringSchema,
  min_total_staff: z.number().int().min(0),
  min_supervisors: z.number().int().min(0),
  crosses_midnight: z.boolean(),
  is_active: z.boolean(),
  created_at: datetimeSchema.nullable(),
  updated_at: datetimeSchema.nullable(),
});

// Schedule schema
export const scheduleSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  created_at: datetimeSchema.nullable(),
  created_by: z.string().nullable(),
  published_at: datetimeSchema.nullable(),
  published_by: z.string().nullable(),
  version: z.number(),
  is_active: z.boolean(),
});

// Requirement status schema
export const requirementStatusSchema = z.object({
  timeBlock: z.object({
    startTime: timeStringSchema,
    endTime: timeStringSchema,
  }),
  requiredCount: z.number().int().min(0),
  assignedCount: z.number().int().min(0),
  isSatisfied: z.boolean(),
});

// Response schemas for API validation
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

// Infer types from schemas
export type ScheduleSchema = z.infer<typeof scheduleSchema>;
export type AssignmentSchema = z.infer<typeof assignmentSchema>;
export type TimeBasedRequirementSchema = z.infer<typeof timeBasedRequirementSchema>;
export type RequirementStatusSchema = z.infer<typeof requirementStatusSchema>; 