/**
 * Error Logger
 * Last Updated: 2025-01-17
 * 
 * Centralized error logging with proper type safety
 */

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
  severity?: ErrorSeverity;
  code?: string;
  requestId?: string;
  userId?: string;
  path?: string;
  timestamp?: string;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  code?: string;
  [key: string]: unknown;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logBuffer: LogEntry[] = [];
  private readonly bufferSize = 100;
  private readonly logEndpoint = '/api/logs';

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  formatError(error: unknown): ErrorDetails {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        ...(error as any)
      };
    }
    
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error
      };
    }
    
    return {
      name: 'UnknownError',
      message: 'An unknown error occurred',
      raw: error
    };
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const logs = [...this.logBuffer];
      this.logBuffer = [];

      await fetch(this.logEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });
    } catch {
      // If flush fails, we'll try again on the next log
      this.logBuffer = [...this.logBuffer];
    }
  }

  private async log(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? {
        ...context,
        severity: context.severity || ErrorSeverity[level.toUpperCase() as keyof typeof ErrorSeverity]
      } : undefined
    };

    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      const logFn = level === 'error' ? 'error'
        : level === 'warn' ? 'warn'
        : level === 'info' ? 'info'
        : 'debug';
      // eslint-disable-next-line no-console
      console[logFn](message, context);
    }
  }

  debug(message: string, context?: LogContext): Promise<void> {
    return this.log('debug', message, { ...context, severity: ErrorSeverity.DEBUG });
  }

  info(message: string, context?: LogContext): Promise<void> {
    return this.log('info', message, { ...context, severity: ErrorSeverity.INFO });
  }

  warn(message: string, context?: LogContext): Promise<void> {
    return this.log('warn', message, { ...context, severity: ErrorSeverity.WARN });
  }

  error(message: string, context?: LogContext): Promise<void> {
    return this.log('error', message, { ...context, severity: ErrorSeverity.ERROR });
  }

  critical(message: string, context?: LogContext): Promise<void> {
    return this.log('error', message, { ...context, severity: ErrorSeverity.CRITICAL });
  }
}

export const errorLogger = ErrorLogger.getInstance();
export const { formatError } = errorLogger; 