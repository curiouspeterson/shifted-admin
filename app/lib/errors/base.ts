/**
 * Base Error Classes
 * Last Updated: 2024-03-21
 * 
 * Core error classes for the application.
 * Provides structured error handling with TypeScript support.
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  SYSTEM = 'system',
  NETWORK = 'network',
  DATABASE = 'database'
}

interface ErrorMetadata {
  code: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  details?: Record<string, unknown>;
  source?: string;
  timestamp?: string;
}

export class BaseError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly details?: Record<string, unknown>;
  public readonly source?: string;
  public readonly timestamp: string;

  constructor(message: string, metadata: ErrorMetadata) {
    super(message);
    this.name = this.constructor.name;
    this.code = metadata.code;
    this.severity = metadata.severity;
    this.category = metadata.category;
    this.details = metadata.details;
    this.source = metadata.source;
    this.timestamp = metadata.timestamp || new Date().toISOString();

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      details: this.details,
      source: this.source,
      timestamp: this.timestamp,
      stack: this.stack
    };
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