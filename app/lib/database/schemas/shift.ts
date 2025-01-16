/**
 * Shift Schema
 * Last Updated: 2024-01-15
 * 
 * Defines the schema and types for shifts with proper validation.
 * Includes relationships with schedules and employees.
 */

import { z } from 'zod'

// Shift status enum
export const ShiftStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

// Base shift schema (shared between input and full schema)
const baseShiftSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  employeeId: z.string().uuid('Invalid employee ID').nullable(),
  startTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  endTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  breakDuration: z.number()
    .int('Break duration must be a whole number')
    .min(0, 'Break duration cannot be negative')
    .max(480, 'Break duration cannot exceed 8 hours'),
  notes: z.string()
    .max(500, 'Notes must be 500 characters or less')
    .nullable(),
  status: z.enum([
    ShiftStatus.DRAFT,
    ShiftStatus.PUBLISHED,
    ShiftStatus.COMPLETED,
    ShiftStatus.CANCELLED
  ]),
  isActive: z.boolean().default(true)
})

// Schema for creating/updating a shift
export const shiftInputSchema = baseShiftSchema.refine(
  data => new Date(data.startTime) < new Date(data.endTime),
  {
    message: 'End time must be after start time',
    path: ['endTime']
  }
)

// Full shift schema including system fields
export const shiftSchema = baseShiftSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().nullable(),
  publishedAt: z.string().datetime().nullable(),
  publishedBy: z.string().uuid().nullable(),
  completedAt: z.string().datetime().nullable(),
  completedBy: z.string().uuid().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  cancelledBy: z.string().uuid().nullable(),
  version: z.number().int().positive()
})

// Infer types from schemas
export type ShiftInput = z.infer<typeof shiftInputSchema>
export type Shift = z.infer<typeof shiftSchema>

// Type guard for shift
export function isShift(value: unknown): value is Shift {
  return shiftSchema.safeParse(value).success
} 