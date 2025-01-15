/**
 * Error Types
 * Last Updated: 2024-03-19 20:00 PST
 * 
 * This file defines the base error types and interfaces used throughout the application.
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Error metadata interface
 */
export interface ErrorMetadata {
  timestamp: string;
  severity: ErrorSeverity;
  source: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Base error interface
 */
export interface BaseError {
  code: string;
  message: string;
  metadata: ErrorMetadata;
  cause?: Error;
}

/**
 * Error codes enum
 */
export const ErrorCodes = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Authentication Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization Errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',

  // Database Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  FOREIGN_KEY: 'FOREIGN_KEY',
  SERIALIZATION_FAILURE: 'SERIALIZATION_FAILURE',
  DEADLOCK_DETECTED: 'DEADLOCK_DETECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CONFLICT: 'CONFLICT',

  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  API_ERROR: 'API_ERROR',

  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // System Errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',

  // Unknown/Other
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Error category enum
 */
export const ErrorCategories = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  DATABASE: 'DATABASE',
  NETWORK: 'NETWORK',
  BUSINESS: 'BUSINESS',
  SYSTEM: 'SYSTEM',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Error recovery action type
 */
export type ErrorRecoveryAction = {
  type: 'retry' | 'refresh' | 'redirect' | 'reset' | 'custom';
  label: string;
  handler: () => Promise<void>;
}; 