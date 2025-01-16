/**
 * API Error Utilities
 * Last Updated: 2024-03-21
 * 
 * Utilities for handling API errors consistently.
 */

/**
 * API error codes
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: ApiErrorCode
  message: string
  details?: unknown
  requestId?: string
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
    requestId
  }
}

/**
 * Format an error for API response
 */
export function formatApiError(error: unknown): ApiErrorResponse {
  if (error instanceof Error) {
    // Handle known error types
    if ('code' in error) {
      return createApiError(
        ApiErrorCode.INTERNAL_ERROR,
        error.message,
        { code: (error as any).code },
        undefined
      )
    }
    
    return createApiError(
      ApiErrorCode.INTERNAL_ERROR,
      error.message,
      undefined,
      undefined
    )
  }
  
  // Handle unknown errors
  return createApiError(
    ApiErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    undefined,
    undefined
  )
} 