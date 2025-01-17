/**
 * Validation Error Handling
 * Last Updated: 2025-01-16
 * 
 * Error handling utilities for form and data validation.
 * Includes strongly typed error structures and formatting utilities.
 */

import { z } from 'zod'
import { ValidationError } from './base'
import { Json } from '../types/json'

/**
 * Validation error code enum
 */
export const ValidationErrorCode = {
  INVALID_TYPE: 'invalid_type',
  REQUIRED_FIELD: 'required_field',
  INVALID_FORMAT: 'invalid_format',
  INVALID_ENUM: 'invalid_enum',
  INVALID_DATE: 'invalid_date',
  INVALID_EMAIL: 'invalid_email',
  INVALID_PHONE: 'invalid_phone',
  INVALID_LENGTH: 'invalid_length',
  INVALID_RANGE: 'invalid_range',
  INVALID_REGEX: 'invalid_regex',
  CUSTOM: 'custom'
} as const;

export type ValidationErrorCode = typeof ValidationErrorCode[keyof typeof ValidationErrorCode];

/**
 * Validation error details with metadata
 */
export interface ValidationErrorDetails {
  field: string
  message: string
  code: ValidationErrorCode
  metadata?: Json
}

/**
 * Format Zod validation errors with enhanced metadata
 */
export function formatZodError(error: z.ZodError): ValidationErrorDetails[] {
  return error.errors.map(err => {
    const metadata: Json | undefined = err.message ? {
      message: err.message,
      path: err.path,
      ...(err as z.ZodIssue & { params?: Record<string, unknown> }).params
    } : undefined;

    return {
      field: err.path.join('.'),
      message: err.message,
      code: mapZodErrorCode(err.code),
      metadata
    };
  });
}

/**
 * Map Zod error codes to our validation error codes
 */
function mapZodErrorCode(zodCode: z.ZodIssueCode): ValidationErrorCode {
  switch (zodCode) {
    case 'invalid_type':
      return ValidationErrorCode.INVALID_TYPE;
    case 'invalid_enum_value':
      return ValidationErrorCode.INVALID_ENUM;
    case 'invalid_string':
      return ValidationErrorCode.INVALID_FORMAT;
    case 'too_small':
    case 'too_big':
      return ValidationErrorCode.INVALID_RANGE;
    case 'custom':
      return ValidationErrorCode.CUSTOM;
    default:
      return ValidationErrorCode.INVALID_FORMAT;
  }
}

/**
 * Create a validation error from Zod error with enhanced details
 */
export function createValidationError(error: z.ZodError): ValidationError {
  const details = formatZodError(error)
  return new ValidationError(
    'Validation failed',
    details as unknown as Record<string, unknown>
  )
}

/**
 * Safe parse with validation error and type inference
 */
export function safeParse<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createValidationError(result.error)
  }
  return result.data
}

/**
 * Format validation errors for display with field mapping
 */
export function formatValidationErrors(
  errors: ValidationErrorDetails[],
  fieldMap?: Record<string, string>
): Record<string, string> {
  return errors.reduce((acc, { field, message }) => ({
    ...acc,
    [fieldMap?.[field] ?? field]: message
  }), {})
}

/**
 * Create a custom validation error with specific code
 */
export function createCustomValidationError(
  field: string,
  message: string,
  code: ValidationErrorCode = ValidationErrorCode.CUSTOM,
  metadata?: Json
): ValidationError {
  return new ValidationError(
    'Validation failed',
    [{
      field,
      message,
      code,
      metadata
    }] as unknown as Record<string, unknown>
  )
} 