/**
 * Base Error Classes
 * Last Updated: 2025-01-16
 * 
 * Core error classes for structured error handling with TypeScript support.
 * Implements monitoring and logging capabilities following Next.js best practices.
 */

import { ValidationErrorCode, ValidationErrorDetails } from './validation';
import { Json } from '@/lib/types/json';
import { errorLogger } from '@/lib/logging/error-logger'

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  SYSTEM = 'system',
  NETWORK = 'network',
  DATABASE = 'database',
  HYDRATION = 'hydration'
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  component?: string;
  action?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

interface ErrorMetadata {
  code: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  details?: Record<string, unknown>;
  source?: string;
  context?: ErrorContext;
  timestamp?: string;
}

/**
 * Base class for all application errors
 * Provides structured error handling with monitoring support
 */
export class BaseError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly details?: Record<string, unknown>;
  public readonly source?: string;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;
  public readonly isOperational: boolean;
  public readonly cause?: Error;

  constructor(
    message: string, 
    metadata: ErrorMetadata,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = metadata.code;
    this.severity = metadata.severity;
    this.category = metadata.category;
    this.details = metadata.details;
    this.source = metadata.source;
    this.context = metadata.context;
    this.timestamp = metadata.timestamp || new Date().toISOString();
    this.isOperational = isOperational;
    this.cause = metadata.cause;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);

    // Log error if it's critical or non-operational
    if (this.severity === ErrorSeverity.CRITICAL || !this.isOperational) {
      this.logError();
    }
  }

  /**
   * Converts error to a JSON structure suitable for logging and monitoring
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      details: this.details,
      source: this.source,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      isOperational: this.isOperational,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : this.cause
    };
  }

  /**
   * Returns a user-friendly error response
   */
  public toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    };
  }

  /**
   * Logs error details for monitoring
   */
  private logError() {
    // TODO: Implement actual error logging
    errorLogger.error('Critical Error:', this.toJSON());
  }

  /**
   * Log critical errors automatically
   */
  public logCritical() {
    if (this.severity === ErrorSeverity.CRITICAL) {
      errorLogger.error('Critical application error', {
        error: this.toJSON(),
        context: this.context
      })
    }
  }
}

// Legacy base class for backward compatibility
export class AppError extends BaseError {
  constructor(
    message: string,
    code = 'APP_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.SYSTEM,
      details
    });
  }
}

export class BusinessError extends BaseError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.BUSINESS,
      details
    });
  }
}

export class SystemError extends BaseError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      details
    });
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      details
    });
  }
}

export class AuthError extends BaseError {
  constructor(
    message: string,
    code = 'UNAUTHORIZED',
    details?: Record<string, unknown>
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTHENTICATION,
      details
    });
  }
}

export class AuthenticationError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code: 'AUTHENTICATION_FAILED',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTHENTICATION,
      details
    });
  }
}

export class NetworkError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code: 'NETWORK_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.NETWORK,
      details
    });
  }
}

export class NotFoundError extends BusinessError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND', details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code: 'FORBIDDEN',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTHORIZATION,
      details
    });
  }
}

export class DatabaseError extends BaseError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, {
      code: 'DATABASE_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.DATABASE,
      details
    });
  }
}

/**
 * Time range validation error
 * Used for date/time range validation failures
 */
export class TimeRangeError extends ValidationError {
  constructor(
    message: string,
    details: ReadonlyArray<ValidationErrorDetails>
  ) {
    super(message, {
      code: ValidationErrorCode.INVALID_RANGE,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.VALIDATION,
      details: details.map(detail => ({
        ...detail,
        code: detail.code || ValidationErrorCode.INVALID_RANGE,
        metadata: detail.metadata || null as Json
      }))
    });
  }

  /**
   * Create a time range error for start/end date validation
   */
  static createDateRangeError(
    startDate: string,
    endDate: string,
    customMessage?: string
  ): TimeRangeError {
    const metadata: Json = {
      comparison: {
        type: 'date',
        operator: 'after',
        startDate,
        endDate,
        valid: new Date(endDate) > new Date(startDate)
      }
    };

    return new TimeRangeError(
      customMessage || 'End date must be after start date',
      [{
        field: 'end_date',
        message: 'End date must be after start date',
        code: ValidationErrorCode.INVALID_RANGE,
        metadata
      }]
    );
  }

  /**
   * Create a time range error for start/end time validation
   */
  static createTimeRangeError(
    startTime: string,
    endTime: string,
    customMessage?: string
  ): TimeRangeError {
    const metadata: Json = {
      comparison: {
        type: 'time',
        operator: 'after',
        startTime,
        endTime,
        valid: endTime > startTime
      }
    };

    return new TimeRangeError(
      customMessage || 'End time must be after start time',
      [{
        field: 'end_time',
        message: 'End time must be after start time',
        code: ValidationErrorCode.INVALID_RANGE,
        metadata
      }]
    );
  }
}

// Re-export everything for convenience
export type { ErrorMetadata }; 