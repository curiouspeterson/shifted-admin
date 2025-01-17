/**
 * API Validation Module
 * Last Updated: 2025-01-16
 * 
 * This file provides utilities for validating API requests using Zod schemas.
 * It includes helpers for validating request bodies, query parameters, and
 * route parameters with proper error handling and type inference.
 */

import { z } from 'zod';
import { BaseError, ErrorCategory, ErrorSeverity } from '../errors/base';
import { ValidationErrorCode, ValidationErrorDetails, formatZodError } from '../errors/validation';
import { NextRequest } from 'next/server';
import { Json, isJson } from '../types/json';

/**
 * API Validation Error
 * Custom error class for API validation failures
 */
export class ApiValidationError extends BaseError {
  constructor(
    message: string,
    public readonly validationDetails: ValidationErrorDetails[],
    public readonly statusCode: number = 400
  ) {
    super(message, {
      code: 'API_VALIDATION_ERROR',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.VALIDATION,
      details: validationDetails.reduce((acc, detail) => ({
        ...acc,
        [detail.field]: {
          message: detail.message,
          code: detail.code,
          metadata: detail.metadata
        }
      }), {} as Record<string, unknown>),
      source: 'api-validation',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get the validation details as a record
   */
  getDetails(): Record<string, ValidationErrorDetails> {
    return this.validationDetails.reduce((acc, detail) => ({
      ...acc,
      [detail.field]: detail
    }), {});
  }
}

/**
 * Validates request body against a Zod schema
 * @param req - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed request body
 * @throws ApiValidationError if validation fails
 */
export async function validateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await req.json();
    if (!isJson(body)) {
      throw new ApiValidationError(
        'Invalid request body format',
        [{
          field: 'body',
          message: 'Request body must be valid JSON',
          code: ValidationErrorCode.INVALID_FORMAT
        }]
      );
    }
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiValidationError('Invalid request body', formatZodError(error));
    }
    if (error instanceof ApiValidationError) {
      throw error;
    }
    throw new ApiValidationError(
      'Failed to parse request body',
      [{
        field: 'body',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ValidationErrorCode.INVALID_FORMAT
      }]
    );
  }
}

/**
 * Validates query parameters against a Zod schema
 * @param req - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed query parameters
 * @throws ApiValidationError if validation fails
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
      throw new ApiValidationError('Invalid query parameters', formatZodError(error));
    }
    throw new ApiValidationError(
      'Failed to parse query parameters',
      [{
        field: 'query',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ValidationErrorCode.INVALID_FORMAT
      }]
    );
  }
}

/**
 * Validates route parameters against a Zod schema
 * @param params - Route parameters object
 * @param schema - Zod schema to validate against
 * @returns Validated and typed route parameters
 * @throws ApiValidationError if validation fails
 */
export function validateParams<T extends z.ZodType>(
  params: Record<string, string>,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiValidationError('Invalid route parameters', formatZodError(error));
    }
    throw new ApiValidationError(
      'Failed to parse route parameters',
      [{
        field: 'params',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: ValidationErrorCode.INVALID_FORMAT
      }]
    );
  }
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

  /**
   * JSON validation schema
   * Validates that a value is valid JSON
   */
  json: z.custom<Json>((val): val is Json => isJson(val), {
    message: 'Invalid JSON format'
  })
}; 