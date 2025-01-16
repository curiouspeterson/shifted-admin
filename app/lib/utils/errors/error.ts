/**
 * Error Utilities
 * Last Updated: 2024-01-16
 * 
 * Utility functions for error handling and formatting.
 */

import { AppError } from '@/lib/errors'

/**
 * Formats an error into a user-friendly message
 */
export function formatError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

/**
 * Creates an AppError with the given message and optional status code
 */
export function createError(message: string, status: number = 500): AppError {
  return new AppError(message, status)
} 