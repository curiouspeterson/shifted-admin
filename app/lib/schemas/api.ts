/**
 * API Schemas
 * Last Updated: 2025-03-19
 * 
 * Zod schemas for API request and response validation
 */

import { z } from 'zod'

/**
 * Generic API response schema
 */
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z.string().optional(),
    code: z.string().optional(),
    details: z.record(z.unknown()).optional(),
    meta: z.object({
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
      total: z.number().int().nonnegative().optional(),
      timestamp: z.string().datetime().optional(),
    }).optional(),
  })

/**
 * API error schema
 */
export const apiErrorSchema = z.object({
  name: z.enum(['ApiError', 'ValidationError', 'AuthError', 'NetworkError']),
  message: z.string(),
  code: z.string(),
  status: z.number().int(),
  details: z.record(z.unknown()).optional(),
})

/**
 * Request options schema
 */
export const requestOptionsSchema = z.object({
  signal: z.instanceof(AbortSignal).nullable().optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  headers: z.record(z.string()).optional(),
})

/**
 * Fetch options schema
 */
export const fetchOptionsSchema = <T extends z.ZodType>(bodySchema: T) =>
  requestOptionsSchema.extend({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
    body: bodySchema.optional(),
    params: z.record(z.string()).optional(),
  })

/**
 * Fetch config schema
 */
export const fetchConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  defaultHeaders: z.record(z.string()).optional(),
  defaultTimeout: z.number().int().positive().optional(),
  maxRetries: z.number().int().nonnegative().optional(),
  onError: z.function().args(apiErrorSchema).returns(z.void()).optional(),
  onResponse: z.function().args(z.instanceof(Response)).returns(z.void()).optional(),
  requestInterceptor: z.function()
    .args(z.custom<RequestInit>())
    .returns(z.promise(z.custom<RequestInit>()))
    .optional(),
  responseInterceptor: z.function()
    .args(z.instanceof(Response))
    .returns(z.promise(z.instanceof(Response)))
    .optional(),
})

/**
 * Day of week enum
 */
export const DayOfWeek = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
} as const;

export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

/**
 * Time requirement query schema
 */
export const listTimeRequirementsQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  schedule_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'updated_at', 'start_date', 'end_date']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Time requirement base schema
 */
const timeRequirementBaseSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  schedule_id: z.string().uuid('Invalid schedule ID'),
  day_of_week: z.nativeEnum(DayOfWeek),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  required_hours: z.number().min(0).max(24),
  is_recurring: z.boolean().default(false),
  priority: z.number().int().min(1).max(5).default(3),
  notes: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Create time requirement schema
 */
export const createTimeRequirementSchema = timeRequirementBaseSchema.extend({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
}).refine(
  (data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end >= start;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
);

/**
 * Update time requirement schema
 */
export const updateTimeRequirementSchema = timeRequirementBaseSchema
  .partial()
  .extend({
    id: z.string().uuid('Invalid time requirement ID'),
    version: z.number().int().positive(),
  }); 