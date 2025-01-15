/**
 * Schemas Index
 * Last Updated: 2024-03
 * 
 * Central export point for all schemas in the application.
 * This includes base schemas, form schemas, and API schemas.
 * 
 * Usage:
 * import { scheduleSchema, ScheduleFormData } from '@/lib/schemas';
 */

// Base Schemas
export * from './base';

// Form Schemas
export * from './forms';

/**
 * Form Error Schema
 * Defines the structure of form validation errors
 */
import { z } from 'zod';

export const formErrorSchema = z.object({
  message: z.string(),
  errors: z.record(z.string()).optional(),
}); 