/**
 * Time-Based Requirement Schema Types
 * Last Updated: 2025-01-16
 * 
 * Defines the domain types and validation schemas for time-based staffing requirements.
 */

import { z } from 'zod';

// Days of the week enum
export const DayOfWeek = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday'
} as const;

export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

// Validation functions
const validateTimeRange = (data: { startTime: string; endTime: string }, ctx: z.RefinementCtx): void => {
  const start = new Date(`1970-01-01T${data.startTime}`);
  const end = new Date(`1970-01-01T${data.endTime}`);
  if (!(end > start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End time must be after start time',
      path: ['endTime'],
    });
  }
};

// Base time requirement fields
const timeRequirementBase = {
  scheduleId: z.string().uuid(),
  dayOfWeek: z.enum([
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
  ]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)'
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)'
  }),
  minStaff: z.number().int().min(1),
  requiresSupervisor: z.boolean().default(false),
  notes: z.string().max(1000).nullish(),
  metadata: z.record(z.unknown()).nullish()
};

// Time requirement input schema
export const timeRequirementInputSchema = z.object({
  ...timeRequirementBase,
  createdBy: z.string().uuid().nullish(),
  updatedBy: z.string().uuid().nullish()
}).superRefine(validateTimeRange);

// Time requirement schema (includes all fields)
export const timeBasedRequirementSchema = z.object({
  ...timeRequirementBase,
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  version: z.number().int().min(1)
}).superRefine(validateTimeRange);

// Infer types from schemas
export type TimeRequirement = z.infer<typeof timeBasedRequirementSchema>;
export type TimeRequirementInput = z.infer<typeof timeRequirementInputSchema>; 