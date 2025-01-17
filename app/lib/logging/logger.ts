/**
 * Modern Logging Service
 * Last Updated: 2025-01-17
 * 
 * Implements structured logging with proper typing and correlation.
 */

import { isAppError, type AppError } from '../errors/types';

/**
 * Log levels with proper typing
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

/**
 * Log entry interface with proper typing
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId: string;
  data?: Record<string, unknown> | undefined;
  error?: Error | AppError | undefined;
  context?: {
    userId?: string | undefined;
    requestId?: string | undefined;
    path?: string | undefined;
    method?: string | undefined;
    statusCode?: number | undefined;
    duration?: number | undefined;
  } | undefined;
  tags?: string[] | undefined;
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole?: boolean | undefined;
  redactKeys?: string[] | undefined;
  additionalTags?: string[] | undefined;
}

/**
 * Modern logger implementation with proper typing
 */
export class Logger {
  private config: LoggerConfig;
  private correlationId: string;

  constructor(config: LoggerConfig) {
    this.config = {
      enableConsole: true,
      redactKeys: ['password', 'token', 'secret', 'key'],
      additionalTags: [],
      ...config,
    };
    this.correlationId = crypto.randomUUID();
  }

  /**
   * Create a child logger with shared correlation ID
   */
  public child(additionalContext: Record<string, unknown> = {}): Logger {
    const childLogger = new Logger(this.config);
    childLogger.correlationId = this.correlationId;
    return childLogger;
  }

  /**
   * Log a message with proper typing
   */
  public log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown> | undefined,
    error?: Error | AppError | undefined
  ): void {
    if (this.shouldLog(level)) {
      const entry = this.createLogEntry(level, message, data, error);
      this.writeLog(entry);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  public debug(message: string, data?: Record<string, unknown> | undefined): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: Record<string, unknown> | undefined): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: Record<string, unknown> | undefined, error?: Error | AppError): void {
    this.log(LogLevel.WARN, message, data, error);
  }

  public error(message: string, error: Error | AppError, data?: Record<string, unknown> | undefined): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  public fatal(message: string, error: Error | AppError, data?: Record<string, unknown> | undefined): void {
    this.log(LogLevel.FATAL, message, data, error);
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown> | undefined,
    error?: Error | AppError | undefined
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      data: data ? this.redactSensitiveData(data) : undefined,
      error: error ? this.formatError(error) : undefined,
      tags: this.config.additionalTags,
    };
  }

  /**
   * Format error for logging
   */
  private formatError(error: Error | AppError): Error {
    if (isAppError(error)) {
      return new Error(JSON.stringify(error));
    }

    return error;
  }

  /**
   * Redact sensitive data
   */
  private redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const redacted = { ...data };
    const redactKeys = this.config.redactKeys || [];

    Object.keys(redacted).forEach((key) => {
      if (redactKeys.some((redactKey) => key.toLowerCase().includes(redactKey.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      }
    });

    return redacted;
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Write log entry
   */
  private writeLog(entry: LogEntry): void {
    // In production, you would send this to your logging service
    // For now, we'll just console.log if enabled
    if (this.config.enableConsole) {
      const { level } = entry;
      const consoleMethod = level === 'debug' ? 'log' : level;
      const logger = console[consoleMethod as keyof typeof console] as (...args: unknown[]) => void;
      logger(JSON.stringify(entry, null, 2));
    }
  }
}

/**
 * Create default logger instance
 */
export const logger: Logger = new Logger({
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: process.env.NODE_ENV !== 'production',
  additionalTags: ['web'],
}); 