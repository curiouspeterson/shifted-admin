/**
 * Base Error Classes
 * Last Updated: 2025-01-17
 * 
 * Base error classes and types for application-wide error handling.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

/**
 * Validation error details
 */
export interface ValidationErrorDetails {
  code: string;
  message: string;
  path: (string | number)[];
}

/**
 * Base error context
 */
export interface ErrorContext {
  code?: string;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  source?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Base error class
 */
export class BaseError extends Error {
  public code: string;
  public severity: ErrorSeverity;
  public category: ErrorCategory;
  public source: string;
  public details?: Record<string, unknown>;
  public timestamp: string;

  constructor(
    message: string,
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = context.code || 'UNKNOWN_ERROR';
    this.severity = context.severity || ErrorSeverity.MEDIUM;
    this.category = context.category || ErrorCategory.SYSTEM;
    this.source = context.source || 'application';
    this.details = context.details;
    this.timestamp = context.timestamp || new Date().toISOString();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      source: this.source,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Database error class
 */
export class DatabaseError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'DATABASE_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.DATABASE,
      source: 'database',
      details
    });
  }
}

/**
 * Validation error class
 */
export class ValidationError extends BaseError {
  constructor(message: string, details: Record<string, unknown>) {
    super(message, {
      code: 'VALIDATION_ERROR',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.VALIDATION,
      source: 'validation',
      details
    });
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHENTICATION_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTHENTICATION,
      source: 'auth',
      details
    });
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHORIZATION_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTHORIZATION,
      source: 'auth',
      details
    });
  }
}

/**
 * Network error class
 */
export class NetworkError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'NETWORK_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.NETWORK,
      source: 'network',
      details
    });
  }
}

/**
 * Business logic error class
 */
export class BusinessError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'BUSINESS_ERROR',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.BUSINESS,
      source: 'business',
      details
    });
  }
}

/**
 * Time range error class
 */
export class TimeRangeError extends BusinessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      ...details,
      code: 'TIME_RANGE_ERROR'
    });
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends BusinessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      ...details,
      code: 'NOT_FOUND_ERROR'
    });
  }
} 