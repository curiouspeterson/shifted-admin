/**
 * API Error Handling
 * Last Updated: 2024-01-16
 * 
 * Error handling utilities for API requests and responses.
 */

import { AppError } from './base'

/**
 * API error codes
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: ApiErrorCode
  message: string
  details?: unknown
  requestId?: string
  timestamp: string
}

/**
 * Create an API error response
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  requestId?: string
): ApiErrorResponse {
  return {
    code,
    message,
    details,
    requestId,
    timestamp: new Date().toISOString()
  }
}

/**
 * Format an error for API response
 */
export function formatApiError(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return createApiError(
      error.code as ApiErrorCode,
      error.message,
      error.details,
      undefined
    )
  }

  if (error instanceof Error) {
    return createApiError(
      ApiErrorCode.INTERNAL_ERROR,
      error.message,
      { stack: error.stack },
      undefined
    )
  }
  
  return createApiError(
    ApiErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    error instanceof Object ? error : undefined,
    undefined
  )
}

/**
 * Parse an API error response
 */
export function parseApiError(response: Response): Promise<ApiErrorResponse> {
  return response.json().catch(() => ({
    code: ApiErrorCode.INTERNAL_ERROR,
    message: `HTTP error! status: ${response.status}`,
    timestamp: new Date().toISOString()
  }))
}

/**
 * API Error Class
 * Last Updated: 2024-03-21
 * 
 * Custom error class for API errors with status code and details.
 */

/**
 * API error class
 * 
 * @example
 * ```ts
 * throw new ApiError('Not found', 404)
 * 
 * throw new ApiError('Validation failed', 400, {
 *   errors: ['Invalid email']
 * })
 * ```
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
} 