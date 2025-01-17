/**
 * Error Logger
 * Last Updated: 2025-01-16
 * 
 * Centralized error logging with proper type safety
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
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
      context,
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
    return this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): Promise<void> {
    return this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): Promise<void> {
    return this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): Promise<void> {
    return this.log('error', message, context);
  }
}

export const errorLogger = ErrorLogger.getInstance(); 