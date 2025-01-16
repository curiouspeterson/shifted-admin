/**
 * Validation Error Handling
 * Last Updated: 2024-01-16
 * 
 * Error handling utilities for form and data validation.
 */

import { z } from 'zod'
import { ValidationError } from './base'

/**
 * Validation error details
 */
export interface ValidationErrorDetails {
  field: string
  message: string
  code?: string
}

/**
 * Format Zod validation errors
 */
export function formatZodError(error: z.ZodError): ValidationErrorDetails[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }))
}

/**
 * Create a validation error from Zod error
 */
export function createValidationError(error: z.ZodError): ValidationError {
  const details = formatZodError(error)
  return new ValidationError(
    'Validation failed',
    details
  )
}

/**
 * Safe parse with validation error
 */
export function safeParse<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createValidationError(result.error)
  }
  return result.data
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: ValidationErrorDetails[]
): Record<string, string> {
  return errors.reduce((acc, { field, message }) => ({
    ...acc,
    [field]: message
  }), {})
} 