/**
 * Error Logger
 * Last Updated: 2024-03
 * 
 * Centralized error logging and monitoring.
 * Features:
 * - Structured error logging
 * - Error categorization
 * - Performance tracking
 * - Integration with monitoring services
 */

interface ErrorMetadata {
  timestamp: number;
  path?: string;
  method?: string;
  statusCode?: number;
  [key: string]: unknown;
}

interface ErrorLogEntry {
  message: string;
  error: Error;
  metadata: ErrorMetadata;
  severity: 'info' | 'warn' | 'error' | 'fatal';
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {
    // Initialize monitoring service if in production
    if (this.isProduction) {
      // TODO: Initialize monitoring service (e.g., Sentry, DataDog)
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with metadata
   */
  error(message: string, data: { error: unknown; [key: string]: unknown }): void {
    const errorEntry = this.createErrorEntry('error', message, data);
    this.logError(errorEntry);
  }

  /**
   * Log a warning with metadata
   */
  warn(message: string, data: { error?: unknown; [key: string]: unknown }): void {
    const errorEntry = this.createErrorEntry('warn', message, data);
    this.logError(errorEntry);
  }

  /**
   * Log info with metadata
   */
  info(message: string, data: { [key: string]: unknown }): void {
    const errorEntry = this.createErrorEntry('info', message, data);
    this.logError(errorEntry);
  }

  /**
   * Log a fatal error with metadata
   */
  fatal(message: string, data: { error: unknown; [key: string]: unknown }): void {
    const errorEntry = this.createErrorEntry('fatal', message, data);
    this.logError(errorEntry);
  }

  /**
   * Create a structured error entry
   */
  private createErrorEntry(
    severity: ErrorLogEntry['severity'],
    message: string,
    data: { error?: unknown; [key: string]: unknown }
  ): ErrorLogEntry {
    const metadata: ErrorMetadata = {
      timestamp: Date.now(),
      ...data,
    };

    // Convert unknown error to Error object
    const error = data.error instanceof Error 
      ? data.error 
      : new Error(data.error ? String(data.error) : 'Unknown error');

    return {
      message,
      error,
      metadata,
      severity,
    };
  }

  /**
   * Log the error entry based on environment
   */
  private logError(entry: ErrorLogEntry): void {
    if (this.isProduction) {
      // TODO: Send to monitoring service
      this.logToProductionService(entry);
    } else {
      this.logToDevelopmentConsole(entry);
    }
  }

  /**
   * Development logging
   */
  private logToDevelopmentConsole(entry: ErrorLogEntry): void {
    const { severity, message, error, metadata } = entry;
    const timestamp = new Date(metadata.timestamp).toISOString();

    console.group(`[${severity.toUpperCase()}] ${timestamp} - ${message}`);
    if (error.stack) {
      console.error(error.stack);
    } else {
      console.error(error);
    }
    console.log('Metadata:', metadata);
    console.groupEnd();
  }

  /**
   * Production logging
   */
  private logToProductionService(entry: ErrorLogEntry): void {
    // TODO: Implement production logging service
    // This would typically send the error to a service like Sentry, DataDog, etc.
    console.error(entry);
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance(); 