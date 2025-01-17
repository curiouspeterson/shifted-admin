/**
 * Error Utility Functions
 * Last Updated: 2025-01-16
 * 
 * Utility functions for error handling and type checking.
 */

import { NetworkError } from './base'

/**
 * Format an error into a consistent structure
 */
export function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any).toJSON?.()
    }
  }
  return {
    message: String(error)
  }
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof TypeError ||
    error instanceof DOMException ||
    (error instanceof Error && error.name === 'NetworkError') ||
    (error instanceof Error && error.message.toLowerCase().includes('network'))
  )
}

/**
 * Check if an error is an offline error
 */
export function isOfflineError(error: unknown): boolean {
  return (
    !navigator.onLine ||
    (error instanceof Error && error.message.toLowerCase().includes('offline')) ||
    (error instanceof Error && error.message.toLowerCase().includes('internet'))
  )
} 