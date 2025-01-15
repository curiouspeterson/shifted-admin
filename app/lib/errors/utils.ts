/**
 * Error Utilities
 * Last Updated: 2024-03-19 20:10 PST
 * 
 * This file provides utility functions for error handling and manipulation.
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  BusinessError,
  SystemError,
} from './base';
import { ErrorCodes, ErrorCategories, ErrorRecoveryAction } from './types';

/**
 * Create an appropriate error instance based on error data
 */
export function createError(
  code: string,
  message: string,
  context: Record<string, any> = {}
): AppError {
  // Map error code to appropriate error class
  switch (getErrorCategory(code)) {
    case ErrorCategories.VALIDATION:
      return new ValidationError(message, context);

    case ErrorCategories.AUTHENTICATION:
      return new AuthenticationError(code, message, context);

    case ErrorCategories.AUTHORIZATION:
      return new AuthorizationError(code, message, context);

    case ErrorCategories.NETWORK:
      return new NetworkError(code, message, context);

    case ErrorCategories.BUSINESS:
      return new BusinessError(code, message, context);

    case ErrorCategories.SYSTEM:
      return new SystemError(code, message, context);

    default:
      return new AppError(code, message, { context });
  }
}

/**
 * Get error category from error code
 */
function getErrorCategory(code: string): string {
  if (code.startsWith('VALIDATION_')) return ErrorCategories.VALIDATION;
  if (code.startsWith('AUTH_')) return ErrorCategories.AUTHENTICATION;
  if (code.startsWith('FORBIDDEN_')) return ErrorCategories.AUTHORIZATION;
  if (code.startsWith('NETWORK_')) return ErrorCategories.NETWORK;
  if (code.startsWith('BUSINESS_')) return ErrorCategories.BUSINESS;
  if (code.startsWith('SYSTEM_')) return ErrorCategories.SYSTEM;
  return ErrorCategories.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: AppError): string {
  // Map error codes to user-friendly messages
  const messageMap: Record<string, string> = {
    [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCodes.INVALID_INPUT]: 'The provided input is invalid.',
    [ErrorCodes.REQUIRED_FIELD]: 'Please fill in all required fields.',
    [ErrorCodes.INVALID_FORMAT]: 'The provided format is invalid.',
    [ErrorCodes.UNAUTHORIZED]: 'Please sign in to continue.',
    [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid username or password.',
    [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection.',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
  };

  return messageMap[error.code] || error.message;
}

/**
 * Get recovery actions for an error
 */
export function getRecoveryActions(error: AppError): ErrorRecoveryAction[] {
  const actions: ErrorRecoveryAction[] = [];

  // Add retry action for network errors
  if (error instanceof NetworkError) {
    actions.push({
      type: 'retry',
      label: 'Try Again',
      handler: async () => {
        // Implement retry logic
      },
    });
  }

  // Add refresh action for session errors
  if (error instanceof AuthenticationError && error.code === ErrorCodes.SESSION_EXPIRED) {
    actions.push({
      type: 'refresh',
      label: 'Refresh Session',
      handler: async () => {
        // Implement session refresh logic
      },
    });
  }

  return actions;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: AppError): Record<string, any> {
  return {
    ...error.toJSON(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  const retryableCodes = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.REQUEST_TIMEOUT,
    ErrorCodes.SERIALIZATION_FAILURE,
    ErrorCodes.DEADLOCK_DETECTED,
  ];

  return retryableCodes.includes(error.code as any);
}

/**
 * Check if error should be reported
 */
export function shouldReportError(error: AppError): boolean {
  // Don't report validation or authentication errors
  if (
    error instanceof ValidationError ||
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError
  ) {
    return false;
  }

  // Don't report specific business errors
  if (
    error instanceof BusinessError &&
    error.code === ErrorCodes.BUSINESS_RULE_VIOLATION
  ) {
    return false;
  }

  return true;
} 