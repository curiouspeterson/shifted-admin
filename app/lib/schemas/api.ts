/**
 * API Schema Module
 * Last Updated: 2025-01-16
 * 
 * Defines Zod schemas for API request/response validation.
 * These schemas are used to validate query parameters, request bodies,
 * and response data across all API routes.
 */

import { z } from 'zod';
import { scheduleSchema } from './schedule';
import { employeeSchema, employeeRoles, employeeStatuses } from './employee';
import type { Database } from '../database/database.types';
import { shiftInputSchema, validateShiftTimes } from './shift';
import { timeRequirementInputSchema, DayOfWeek } from './time-requirement';

// Type aliases for clarity
type EmployeeRole = Database['public']['Enums']['employee_role'];
type EmployeeStatus = Database['public']['Enums']['employee_status'];

// Validation functions
const isValidDateRange = (start: string, end: string): boolean => {
  return new Date(end) >= new Date(start);
};

const validateTimeRange = (data: { startTime?: string; endTime?: string }, ctx: z.RefinementCtx): void => {
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['endTime'],
      });
    }
  }
};

// Employee filter schema
export const employeeFilterSchema = z.object({
  role: z.enum(employeeRoles).nullish(),
  status: z.enum(employeeStatuses).nullish(),
  search: z.string().nullish(),
  department: z.string().nullish(),
  position: z.string().nullish(),
});

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

// Date range schema base
const dateRangeSchemaBase = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
});

// Date range schema with refinement
export const dateRangeSchema = dateRangeSchemaBase.superRefine((data, ctx) => {
  if (data.start_date && data.end_date) {
    if (!isValidDateRange(data.start_date, data.end_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['end_date'],
      });
    }
  }
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
  status: z.enum(['draft', 'published', 'archived']).nullish(),
}).superRefine((data, ctx) => {
  if (data.start_date && data.end_date) {
    if (!isValidDateRange(data.start_date, data.end_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['end_date'],
      });
    }
  }
});

// POST /api/schedules request body
export const createScheduleSchema = scheduleSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  publishedAt: true,
  publishedBy: true,
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

// POST /api/shifts request body
export const createShiftSchema = shiftInputSchema.extend({}).refine(validateShiftTimes, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// PATCH /api/shifts/[id] request body
export const updateShiftSchema = shiftInputSchema.partial().refine(validateShiftTimes, {
  message: 'End time must be after start time',
  path: ['endTime'],
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

// Base schema for assignment creation
const assignmentBaseSchema = z.object({
  employeeId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum(['pending', 'confirmed', 'declined']),
  notes: z.string().max(1000).nullish(),
  metadata: z.record(z.unknown()).nullish(),
  createdBy: z.string().uuid().nullish(),
  updatedBy: z.string().uuid().nullish()
});

// POST /api/schedules/[id]/assignments request body
export const createAssignmentSchema = assignmentBaseSchema.superRefine(validateTimeRange);

// PATCH /api/schedules/[id]/assignments/[id] request body
export const updateAssignmentSchema = assignmentBaseSchema.partial().superRefine(validateTimeRange);

/**
 * Employee API Schemas
 */

// GET /api/employees query parameters
export const listEmployeesQuerySchema = z.object({
  ...paginationSchema.shape,
  ...employeeSortSchema.shape,
  status: z.enum(employeeStatuses).nullish(),
  role: z.enum(employeeRoles).nullish(),
  department: z.string().min(1).max(100).nullish(),
});

// POST /api/employees request body
const employeeBaseSchema = z.object(employeeSchema.shape);
export const createEmployeeSchema = employeeBaseSchema.pick({
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  department: true,
  position: true,
  metadata: true
});

// PATCH /api/employees/[id] request body
export const updateEmployeeSchema = createEmployeeSchema.partial();

/**
 * Time Requirement API Schemas
 */

// GET /api/time-requirements query parameters
export const listTimeRequirementsQuerySchema = z.object({
  ...paginationSchema.shape,
  ...timeRequirementSortSchema.shape,
  schedule_id: z.string().uuid().nullish(),
  day_of_week: z.nativeEnum(DayOfWeek).nullish(),
  requires_supervisor: z.boolean().nullish(),
});

// POST /api/time-requirements request body
export const createTimeRequirementSchema = timeRequirementInputSchema;

// PATCH /api/time-requirements/[id] request body
const partialTimeRequirementSchema = z.object({
  scheduleId: z.string().uuid().optional(),
  dayOfWeek: z.enum([
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
  ]).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)'
  }).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)'
  }).optional(),
  minStaff: z.number().int().min(1).optional(),
  requiresSupervisor: z.boolean().optional(),
  notes: z.string().max(1000).nullish(),
  metadata: z.record(z.unknown()).nullish()
}).superRefine(validateTimeRange);

export const updateTimeRequirementSchema = partialTimeRequirementSchema;

/**
 * API Response Schemas
 */

// Generic API response schema
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.null(),
    metadata: z.record(z.unknown()).optional(),
  });

// Generic API list response schema
export const apiListResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  apiResponseSchema(z.array(dataSchema));

// Export query parameter types
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