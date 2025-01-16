/**
 * Error Utilities
 * Last Updated: 2024-01-16
 * 
 * Common error handling utilities for the application.
 */

import { AppError } from '@/lib/errors/base'

/**
 * Error options for creating errors
 */
export interface ErrorOptions {
  code?: string
  statusCode?: number
  details?: unknown
  cause?: unknown
}

/**
 * Format an error into a consistent structure
 */
export function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
      cause: error.cause
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    }
  }

  return {
    message: String(error)
  }
}

/**
 * Create an error with consistent structure
 */
export function createError(message: string, options: ErrorOptions = {}): AppError {
  const { code, statusCode, details, cause } = options
  const error = new AppError(message, code, statusCode, details)
  if (cause) error.cause = cause
  return error
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'NetworkError' ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )
  }
  return false
}

/**
 * Check if an error is an offline error
 */
export function isOfflineError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('offline') || !navigator.onLine
  }
  return !navigator.onLine
}

/**
 * Common error creators
 */
export const createCommonError = {
  network: (details?: unknown) =>
    createError('Network error occurred', {
      code: 'NETWORK_ERROR',
      statusCode: 503,
      details
    }),

  offline: (details?: unknown) =>
    createError('You are offline', {
      code: 'OFFLINE',
      statusCode: 503,
      details
    }),

  validation: (message: string, details?: unknown) =>
    createError(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details
    }),

  unauthorized: (message = 'Unauthorized access', details?: unknown) =>
    createError(message, {
      code: 'UNAUTHORIZED',
      statusCode: 401,
      details
    }),

  notFound: (message = 'Resource not found', details?: unknown) =>
    createError(message, {
      code: 'NOT_FOUND',
      statusCode: 404,
      details
    })
} 