/**
 * API Validation Module
 * Last Updated: 2024
 * 
 * This file provides utilities for validating API requests using Zod schemas.
 * It includes helpers for validating request bodies, query parameters, and
 * route parameters with proper error handling and type inference.
 * 
 * Features:
 * - Request body validation
 * - Query parameter validation
 * - Route parameter validation
 * - Error handling with detailed messages
 */

import { z } from 'zod';
import { AppError } from '../errors';
import { NextRequest } from 'next/server';

/**
 * Request Validation Error
 * Custom error class for validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, public errors?: z.ZodError) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Validates request body against a Zod schema
 * @param req - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed request body
 * @throws ValidationError if validation fails
 */
export async function validateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request body', error);
    }
    throw new ValidationError('Failed to parse request body');
  }
}

/**
 * Validates query parameters against a Zod schema
 * @param req - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed query parameters
 * @throws ValidationError if validation fails
 */
export function validateQuery<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): z.infer<T> {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    return schema.parse(searchParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error);
    }
    throw new ValidationError('Failed to parse query parameters');
  }
}

/**
 * Validates route parameters against a Zod schema
 * @param params - Route parameters object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed route parameters
 * @throws ValidationError if validation fails
 */
export function validateParams<T extends z.ZodType>(
  params: Record<string, string>,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid route parameters', error);
    }
    throw new ValidationError('Failed to parse route parameters');
  }
}

/**
 * Formats validation errors into a user-friendly message
 * @param error - Zod validation error
 * @returns Formatted error message
 */
export function formatValidationErrors(error: z.ZodError): string {
  return error.errors
    .map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    })
    .join(', ');
}

/**
 * Common validation schemas for reuse across endpoints
 */
export const commonSchemas = {
  /**
   * UUID validation schema
   * Validates string is a valid UUID v4
   */
  uuid: z.string().uuid('Invalid UUID format'),

  /**
   * Date string validation schema
   * Validates string is in YYYY-MM-DD format
   */
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Invalid date format. Use YYYY-MM-DD',
  }),

  /**
   * Time string validation schema
   * Validates string is in HH:MM format
   */
  timeString: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Invalid time format. Use HH:MM (24-hour)',
  }),

  /**
   * Pagination parameters schema
   * Validates common pagination query parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  /**
   * Sort parameters schema
   * Validates common sorting query parameters
   */
  sort: z.object({
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
}; 