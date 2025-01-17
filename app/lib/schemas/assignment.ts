/**
 * Assignment Schema Types
 * Last Updated: 2024-03-21
 * 
 * Defines the domain types and validation schemas for assignments.
 */

import { z } from 'zod';

// Assignment status enum
export const AssignmentStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined'
} as const;

export type AssignmentStatus = typeof AssignmentStatus[keyof typeof AssignmentStatus];

// Base assignment fields
const assignmentBase = {
  employeeId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum([
    AssignmentStatus.PENDING,
    AssignmentStatus.CONFIRMED,
    AssignmentStatus.DECLINED
  ]),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional()
};

// Assignment input schema
export const assignmentInputSchema = z.object({
  ...assignmentBase,
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional()
});

// Assignment schema (includes all fields)
export const assignmentSchema = z.object({
  ...assignmentBase,
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  version: z.number().int().min(1)
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

// Infer types from schemas
export type Assignment = z.infer<typeof assignmentSchema>;
export type AssignmentInput = z.infer<typeof assignmentInputSchema>; 