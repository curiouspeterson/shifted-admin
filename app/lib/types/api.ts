/**
 * API Response Types
 * Last Updated: 2024-03-21
 * 
 * Type definitions for API responses with discriminated unions for type safety.
 */

// Discriminated union for API responses
export type ApiResponse<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: { message: string; code?: string } }
  | { status: 'notFound' }; 