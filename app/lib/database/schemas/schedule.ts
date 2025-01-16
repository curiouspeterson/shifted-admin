/**
 * Schedule Schema
 * Last Updated: 2024-01-15
 * 
 * Defines the schema and types for schedules with proper validation.
 */

import { z } from 'zod'

// Schedule status enum
export const ScheduleStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
} as const

// Base schedule schema (shared between input and full schema)
const baseScheduleSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .nullable(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date'),
  status: z.enum([
    ScheduleStatus.DRAFT,
    ScheduleStatus.PUBLISHED,
    ScheduleStatus.ARCHIVED
  ]),
  isActive: z.boolean().default(true)
})

// Schema for creating/updating a schedule
export const scheduleInputSchema = baseScheduleSchema.refine(
  data => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
)

// Full schedule schema including system fields
export const scheduleSchema = baseScheduleSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().nullable(),
  publishedAt: z.string().datetime().nullable(),
  publishedBy: z.string().uuid().nullable(),
  version: z.number().int().positive()
})

// Infer types from schemas
export type ScheduleInput = z.infer<typeof scheduleInputSchema>
export type Schedule = z.infer<typeof scheduleSchema>

// Type guard for schedule
export function isSchedule(value: unknown): value is Schedule {
  return scheduleSchema.safeParse(value).success
} 