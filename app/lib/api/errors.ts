/**
 * API Error Handling
 * Last Updated: 2024-03-20
 * 
 * This module provides centralized error handling for API routes
 * following Next.js App Router best practices.
 */

import { NextResponse } from 'next/server'
import { DatabaseError } from '@/lib/database/base/errors'
import { errorLogger } from '@/lib/logging/error-logger'
import { ZodError } from 'zod'

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
 * Map database error to API error
 */
function mapDatabaseError(error: DatabaseError): ApiErrorResponse {
  const requestId = error.context?.requestId

  switch (error.code) {
    case 'RECORD_NOT_FOUND':
      return {
        code: ApiErrorCode.NOT_FOUND,
        message: error.message,
        requestId
      }
    
    case 'VALIDATION_FAILED':
    case 'CONSTRAINT_VIOLATION':
      return {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: error.message,
        details: error.context?.details,
        requestId
      }
    
    case 'OPTIMISTIC_LOCK_FAILED':
    case 'SERIALIZATION_FAILURE':
    case 'DEADLOCK_DETECTED':
      return {
        code: ApiErrorCode.CONFLICT,
        message: error.message,
        details: {
          retryable: error.retryable,
          ...error.context
        },
        requestId
      }
    
    default:
      return {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        requestId
      }
  }
}

/**
 * Map Zod validation error to API error
 */
function mapZodError(error: ZodError): ApiErrorResponse {
  return {
    code: ApiErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details: error.errors
  }
}

interface FormattedError {
  name: string
  message: string
  stack?: string
  code?: string
  details?: unknown
  cause?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Format error for logging
 */
function formatError(error: unknown): FormattedError {
  if (error instanceof DatabaseError) {
    const json = error.toJSON()
    return {
      name: json.name as string,
      message: json.message as string,
      code: json.code as string,
      details: json.context,
      stack: json.stack as string | undefined,
      cause: json.cause as FormattedError['cause']
    }
  }
  if (error instanceof ZodError) {
    return {
      name: 'ZodError',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors
    }
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: unknown,
  requestId = crypto.randomUUID()
): NextResponse {
  // Log error
  errorLogger.error('API error', {
    error: formatError(error),
    requestId
  })

  let response: ApiErrorResponse
  let status: number

  if (error instanceof DatabaseError) {
    response = mapDatabaseError(error)
    status = error.statusCode
  }
  else if (error instanceof ZodError) {
    response = mapZodError(error)
    status = 400
  }
  else if (error instanceof Error) {
    response = {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: error.message,
      requestId
    }
    status = 500
  }
  else {
    response = {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: String(error),
      requestId
    }
    status = 500
  }

  return NextResponse.json(response, { status })
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(
  message: string,
  requestId = crypto.randomUUID()
): NextResponse {
  const response: ApiErrorResponse = {
    code: ApiErrorCode.NOT_FOUND,
    message,
    requestId
  }
  return NextResponse.json(response, { status: 404 })
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedResponse(
  message = 'Unauthorized',
  requestId = crypto.randomUUID()
): NextResponse {
  const response: ApiErrorResponse = {
    code: ApiErrorCode.UNAUTHORIZED,
    message,
    requestId
  }
  return NextResponse.json(response, { status: 401 })
}

/**
 * Create a forbidden error response
 */
export function createForbiddenResponse(
  message = 'Forbidden',
  requestId = crypto.randomUUID()
): NextResponse {
  const response: ApiErrorResponse = {
    code: ApiErrorCode.FORBIDDEN,
    message,
    requestId
  }
  return NextResponse.json(response, { status: 403 })
} 