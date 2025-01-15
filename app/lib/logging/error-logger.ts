/**
 * Error Logging Utility
 * Last Updated: 2024-01-15
 * 
 * This module provides centralized error logging functionality with:
 * - Structured log format
 * - Severity levels
 * - Request context tracking
 * - Environment-aware logging
 * - Sentry integration for error monitoring
 */

import { AppError } from '../errors/base';
import { reportError } from '../monitoring/sentry';

// Error severity levels
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Error log entry structure
export interface ErrorLogEntry {
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  path?: string;
  method?: string;
  requestId?: string;
  userId?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

// Error logger configuration
interface ErrorLoggerConfig {
  minSeverity?: ErrorSeverity;
  enableStackTrace?: boolean;
  logToConsole?: boolean;
  reportToSentry?: boolean;
}

const defaultConfig: ErrorLoggerConfig = {
  minSeverity: ErrorSeverity.DEBUG,
  enableStackTrace: process.env.NODE_ENV === 'development',
  logToConsole: true,
  reportToSentry: process.env.NODE_ENV === 'production',
};

/**
 * ErrorLogger class for centralized error logging
 */
export class ErrorLogger {
  private config: ErrorLoggerConfig;

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Log an error with the specified severity and context
   */
  public log(
    error: Error | AppError | unknown,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Record<string, unknown> = {}
  ): void {
    // Skip logging if error severity is below minimum
    if (this.getSeverityLevel(severity) < this.getSeverityLevel(this.config.minSeverity!)) {
      return;
    }

    const logEntry = this.createLogEntry(error, severity, context);
    
    // Write to configured outputs
    this.writeLog(logEntry);

    // Report to Sentry if enabled
    if (this.config.reportToSentry) {
      reportError(error, severity, context);
    }
  }

  /**
   * Convenience methods for different severity levels
   */
  public debug(error: unknown, context?: Record<string, unknown>): void {
    this.log(error, ErrorSeverity.DEBUG, context);
  }

  public info(error: unknown, context?: Record<string, unknown>): void {
    this.log(error, ErrorSeverity.INFO, context);
  }

  public warn(error: unknown, context?: Record<string, unknown>): void {
    this.log(error, ErrorSeverity.WARN, context);
  }

  public error(error: unknown, context?: Record<string, unknown>): void {
    this.log(error, ErrorSeverity.ERROR, context);
  }

  public critical(error: unknown, context?: Record<string, unknown>): void {
    this.log(error, ErrorSeverity.CRITICAL, context);
  }

  /**
   * Create a structured log entry from an error
   */
  private createLogEntry(
    error: unknown,
    severity: ErrorSeverity,
    context: Record<string, unknown>
  ): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      message: this.getErrorMessage(error),
      context,
    };

    // Add stack trace if enabled
    if (this.config.enableStackTrace && error instanceof Error) {
      entry.stack = error.stack;
    }

    // Add additional context for AppError instances
    if (error instanceof AppError) {
      entry.code = error.code;
    }

    // Add request context if available
    if (context.requestId) {
      entry.requestId = String(context.requestId);
    }
    if (context.path) {
      entry.path = String(context.path);
    }
    if (context.method) {
      entry.method = String(context.method);
    }
    if (context.userId) {
      entry.userId = String(context.userId);
    }

    return entry;
  }

  /**
   * Write the log entry to configured outputs
   */
  private writeLog(entry: ErrorLogEntry): void {
    // Console logging
    if (this.config.logToConsole) {
      const consoleMethod = this.getConsoleMethod(entry.severity);
      consoleMethod(JSON.stringify(entry, null, 2));
    }

    // TODO: Add additional logging outputs (e.g., file system)
  }

  /**
   * Get appropriate console method for severity level
   */
  private getConsoleMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.DEBUG:
        return console.debug;
      case ErrorSeverity.INFO:
        return console.info;
      case ErrorSeverity.WARN:
        return console.warn;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Get numeric severity level for comparison
   */
  private getSeverityLevel(severity: ErrorSeverity): number {
    const levels: Record<ErrorSeverity, number> = {
      [ErrorSeverity.DEBUG]: 0,
      [ErrorSeverity.INFO]: 1,
      [ErrorSeverity.WARN]: 2,
      [ErrorSeverity.ERROR]: 3,
      [ErrorSeverity.CRITICAL]: 4,
    };
    return levels[severity] ?? 0;
  }

  /**
   * Extract error message from unknown error type
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }
}

// Export singleton instance with default configuration
export const errorLogger = new ErrorLogger(); 