/**
 * Database Logging
 * Last Updated: 2024-03-19 18:35 PST
 */

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log metadata
 */
export interface LogMetadata {
  [key: string]: any;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  minLevel?: LogLevel;
  customLogger?: (level: LogLevel, message: string, metadata?: LogMetadata) => void;
}

/**
 * Default logger implementation
 */
class DatabaseLogger implements Logger {
  private readonly config: Required<LoggerConfig>;
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel || 'info',
      customLogger: config.customLogger || this.defaultLogger.bind(this),
    };
  }

  private defaultLogger(level: LogLevel, message: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}`);
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.minLevel];
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('debug')) {
      this.config.customLogger('debug', message, metadata);
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) {
      this.config.customLogger('info', message, metadata);
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('warn')) {
      this.config.customLogger('warn', message, metadata);
    }
  }

  error(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('error')) {
      this.config.customLogger('error', message, metadata);
    }
  }
}

/**
 * Export singleton logger instance
 */
export const logger = new DatabaseLogger(); 