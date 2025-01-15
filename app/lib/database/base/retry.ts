/**
 * Retry Utilities
 * Last Updated: 2024-03-19 17:15 PST
 * 
 * This file provides utilities for retrying failed operations with
 * configurable backoff strategies and error handling.
 */

import { DatabaseError, DatabaseErrorType } from './types';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 5000, // ms
  backoffFactor: 2,
  retryableErrors: [
    '40001', // serialization_failure
    '40P01', // deadlock_detected
    '57P04', // database_dropped
    '57P05', // connection_failure
    'XX000', // internal_error
  ],
};

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;
  let delay = config.initialDelay;

  while (attempt < config.maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      attempt++;

      if (attempt === config.maxAttempts || !isRetryableError(error, config.retryableErrors)) {
        throw error;
      }

      // Log retry attempt
      console.warn(
        `Operation failed (attempt ${attempt}/${config.maxAttempts}). Retrying in ${delay}ms...`,
        { error, attempt, delay }
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }

  throw new DatabaseError(
    DatabaseErrorType.TRANSACTION_FAILED,
    'Operation failed after maximum retry attempts'
  );
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableCodes: string[]): boolean {
  // Handle PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string };
    return retryableCodes.includes(pgError.code);
  }

  // Handle network errors
  if (error instanceof Error) {
    const networkErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ENETUNREACH',
    ];
    return networkErrors.some(code => error.message.includes(code));
  }

  return false;
}

/**
 * Decorator for adding retry behavior to class methods
 */
export function withRetry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return retryOperation(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
} 