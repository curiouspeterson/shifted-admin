/**
 * API Schema Module
 * Last Updated: 2024-03
 * 
 * Defines Zod schemas for API request/response validation.
 * These schemas are used to validate query parameters, request bodies,
 * and response data across all API routes.
 * 
 * Features:
 * - Common query parameter validation
 * - Pagination schema
 * - Sorting schema
 * - API response wrapper schemas
 * - Type inference helpers
 */

import { z } from 'zod';
import {
  scheduleSchema,
  assignmentSchema,
  employeeSchema,
  shiftSchema,
  timeBasedRequirementSchema,
} from './schedule';
import type { Database } from '../supabase/database.types';

// Get schedule row type from database types
type ScheduleRow = Database['public']['Tables']['schedules']['Row'];
type ShiftRow = Database['public']['Tables']['shifts']['Row'];
type EmployeeRow = Database['public']['Tables']['employees']['Row'];

/**
 * Common Query Parameters
 */

// Pagination schema
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

// Sorting schema for schedules
export const scheduleSortSchema = z.object({
  sort: z.enum([
    'start_date',
    'end_date',
    'created_at',
    'status',
    'is_published',
    'created_by',
    'published_at',
    'published_by',
    'id',
    'updated_at',
  ] as const).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Sorting schema for shifts
export const shiftSortSchema = z.object({
  sort: z.enum([
    'name',
    'start_time',
    'end_time',
    'duration_hours',
    'crosses_midnight',
    'requires_supervisor',
    'created_at',
    'updated_at',
    'created_by',
    'id',
  ] as const).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Date range schema base (without refinement)
const dateRangeSchemaBase = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Date range schema with refinement
export const dateRangeSchema = dateRangeSchemaBase.refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// Sorting schema for employees
export const employeeSortSchema = z.object({
  sort: z.enum([
    'first_name',
    'last_name',
    'email',
    'role',
    'status',
    'department',
    'position',
    'created_at',
    'updated_at',
    'id',
  ] as const).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Sorting schema for assignments
export const assignmentSortSchema = z.object({
  sort: z.enum([
    'start_time',
    'end_time',
    'status',
    'employee_id',
    'schedule_id',
    'notes',
    'created_at',
    'updated_at',
    'id',
  ] as const).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Sorting schema for time requirements
export const timeRequirementSortSchema = z.object({
  sort: z.enum([
    'start_time',
    'end_time',
    'day_of_week',
    'min_staff',
    'requires_supervisor',
    'schedule_id',
    'created_at',
    'updated_at',
    'id',
  ] as const).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schedule API Schemas
 */

// GET /api/schedules query parameters
export const listSchedulesQuerySchema = z.object({
  ...paginationSchema.shape,
  ...scheduleSortSchema.shape,
  ...dateRangeSchemaBase.shape,
  status: z.enum(['draft', 'published', 'archived']).optional(),
}).refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// POST /api/schedules request body
export const createScheduleSchema = scheduleSchema.omit({
  id: true,
  created_at: true,
  created_by: true,
  published_at: true,
  published_by: true,
  version: true,
});

// PATCH /api/schedules/[id] request body
export const updateScheduleSchema = createScheduleSchema.partial();

/**
 * Shift API Schemas
 */

// GET /api/shifts query parameters
export const listShiftsQuerySchema = z.object({
  ...paginationSchema.shape,
  ...shiftSortSchema.shape,
  requires_supervisor: z.boolean().optional(),
  crosses_midnight: z.boolean().optional(),
});

// Base shift schema without refinement
const shiftSchemaBase = z.object({
  name: z.string().min(1, 'Shift name is required'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)',
  }),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)',
  }),
  duration_hours: z.number().min(0, 'Duration must be positive'),
  crosses_midnight: z.boolean().optional(),
  requires_supervisor: z.boolean().optional(),
});

// Refinement function for shift time validation
const validateShiftTimes = (data: Partial<z.infer<typeof shiftSchemaBase>>) => {
  if (data.start_time && data.end_time) {
    const start = new Date(`1970-01-01T${data.start_time}`);
    const end = new Date(`1970-01-01T${data.end_time}`);
    if (data.crosses_midnight) {
      end.setDate(end.getDate() + 1);
    }
    return end > start;
  }
  return true;
};

// POST /api/shifts request body
export const createShiftSchema = shiftSchemaBase.refine(validateShiftTimes, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

// PATCH /api/shifts/[id] request body
export const updateShiftSchema = shiftSchemaBase.partial().refine(validateShiftTimes, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

/**
 * Assignment API Schemas
 */

// GET /api/schedules/[id]/assignments query parameters
export const listAssignmentsQuerySchema = z.object({
  ...paginationSchema.shape,
  ...assignmentSortSchema.shape,
  employee_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'declined']).optional(),
});

// POST /api/schedules/[id]/assignments request body
export const createAssignmentSchema = assignmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  schedule_id: true,
});

// PATCH /api/schedules/[id]/assignments/[id] request body
export const updateAssignmentSchema = createAssignmentSchema.partial();

/**
 * Employee API Schemas
 */

// GET /api/employees query parameters
export const listEmployeesQuerySchema = z.object({
  ...paginationSchema.shape,
  ...employeeSortSchema.shape,
  status: z.enum(['active', 'inactive']).optional(),
  role: z.enum(['employee', 'supervisor', 'admin']).optional(),
  department: z.string().min(1).max(100).optional(),
});

// POST /api/employees request body
export const createEmployeeSchema = employeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// PATCH /api/employees/[id] request body
export const updateEmployeeSchema = createEmployeeSchema.partial();

/**
 * API Response Wrappers
 */

// Generic API response wrapper
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    metadata: z.object({
      timestamp: z.string().optional(),
      count: z.number().optional(),
      requestId: z.string().optional(),
      duration: z.number().optional(),
      cached: z.boolean().optional(),
      cacheHit: z.boolean().optional(),
      cacheTtl: z.number().optional(),
      rateLimit: z.object({
        limit: z.number(),
        remaining: z.number(),
        reset: z.number(),
      }).optional(),
    }).optional(),
  });

// List response wrapper
export const apiListResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  apiResponseSchema(z.array(dataSchema));

/**
 * Type Inference
 * Helper types inferred from the Zod schemas
 */
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;
export type CreateSchedule = z.infer<typeof createScheduleSchema>;
export type UpdateSchedule = z.infer<typeof updateScheduleSchema>;

export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
export type CreateAssignment = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;

export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
export type CreateShift = z.infer<typeof createShiftSchema>;
export type UpdateShift = z.infer<typeof updateShiftSchema>;

export type ListTimeRequirementsQuery = z.infer<typeof listTimeRequirementsQuerySchema>;
export type CreateTimeRequirement = z.infer<typeof createTimeRequirementSchema>;
export type UpdateTimeRequirement = z.infer<typeof updateTimeRequirementSchema>;

/**
 * Time Requirement API Schemas
 */

// GET /api/time-requirements query parameters
export const listTimeRequirementsQuerySchema = z.object({
  ...paginationSchema.shape,
  ...timeRequirementSortSchema.shape,
  schedule_id: z.string().uuid().optional(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  requires_supervisor: z.boolean().optional(),
});

// Base schema for time requirements without refinement
const timeRequirementBaseSchema = z.object({
  ...timeBasedRequirementSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }).shape,
});

// POST /api/time-requirements request body
export const createTimeRequirementSchema = timeRequirementBaseSchema.transform((data) => ({
  ...data,
  requires_supervisor: data.requires_supervisor ?? false,
}));

// PATCH /api/time-requirements/[id] request body
export const updateTimeRequirementSchema = timeRequirementBaseSchema.partial().transform((data) => ({
  ...data,
  requires_supervisor: data.requires_supervisor ?? undefined,
})); 