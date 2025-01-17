/**
 * Shift Schema Types
 * Last Updated: 2024-03-21
 * 
 * Defines the domain types and validation schemas for shifts.
 */

import { z } from 'zod';

// Base shift fields
const shiftBase = {
  name: z.string().min(1, 'Shift name is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)'
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be in 24-hour format (HH:MM:SS)'
  }),
  durationHours: z.number().min(0, 'Duration must be positive'),
  crossesMidnight: z.boolean().default(false),
  requiresSupervisor: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional()
};

// Shift input schema
export const shiftInputSchema = z.object({
  ...shiftBase,
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional()
});

// Shift schema (includes all fields)
export const shiftSchema = z.object({
  ...shiftBase,
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  version: z.number().int().min(1)
});

// Helper function to validate shift times
export const validateShiftTimes = (data: Partial<z.infer<typeof shiftSchema>>) => {
  if (data.startTime && data.endTime) {
    const start = new Date(`1970-01-01T${data.startTime}`);
    const end = new Date(`1970-01-01T${data.endTime}`);
    if (data.crossesMidnight) {
      end.setDate(end.getDate() + 1);
    }
    return end > start;
  }
  return true;
};

// Create shift schema with time validation
export const createShiftSchema = shiftInputSchema.refine(validateShiftTimes, {
  message: 'End time must be after start time',
  path: ['endTime']
});

// Update shift schema with time validation
export const updateShiftSchema = shiftInputSchema.partial().refine(validateShiftTimes, {
  message: 'End time must be after start time',
  path: ['endTime']
});

// Infer types from schemas
export type Shift = z.infer<typeof shiftSchema>;
export type ShiftInput = z.infer<typeof shiftInputSchema>; 