/**
 * Schedule Schema Types
 * Last Updated: 2024-01-16
 * 
 * Defines the domain types for schedules.
 */

import { z } from 'zod'

// Schedule status enum
export const ScheduleStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const

export type ScheduleStatus = typeof ScheduleStatus[keyof typeof ScheduleStatus]

// Base schedule fields
const scheduleBase = {
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum([
    ScheduleStatus.DRAFT,
    ScheduleStatus.PUBLISHED,
    ScheduleStatus.ARCHIVED
  ]),
  isActive: z.boolean().default(false)
}

// Schedule input schema
export const scheduleInputSchema = z.object({
  ...scheduleBase,
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional()
})

// Schedule schema (includes all fields)
export const scheduleSchema = z.object({
  ...scheduleBase,
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  publishedAt: z.string().datetime().nullable(),
  publishedBy: z.string().uuid().nullable(),
  version: z.number().int().min(1)
})

// Infer types from schemas
export type Schedule = z.infer<typeof scheduleSchema>
export type ScheduleInput = z.infer<typeof scheduleInputSchema> 