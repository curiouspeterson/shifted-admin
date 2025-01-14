/**
 * Error Handling Module
 * Last Updated: 2024
 * 
 * Provides error handling utilities for the API layer, including a custom
 * error class and helper functions for consistent error handling across
 * the application.
 */

/**
 * Custom API Error class
 * Extends the base Error class with additional status code support
 * 
 * @property message - Error message describing what went wrong
 * @property status - HTTP status code for the error (defaults to 500)
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Type guard for APIError
 * Checks if an unknown error is an instance of APIError
 * 
 * @param error - The error to check
 * @returns True if the error is an APIError instance
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Error Handler Function
 * Processes errors and returns a consistent error response format
 * 
 * @param error - The error to handle (can be any type)
 * @returns Object containing error message and status code
 */
export function handleError(error: unknown): { message: string; status: number } {
  // Handle APIError instances
  if (isAPIError(error)) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
    };
  }

  // Handle unknown error types
  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
} 