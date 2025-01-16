/**
 * Error Logger
 * Last Updated: 2024-01-16
 * 
 * A utility for consistent error logging across the application.
 * Supports different log levels and structured logging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: Record<string, any>
}

interface ErrorDetails {
  name: string
  message: string
  stack?: string
  cause?: {
    name: string
    message: string
    stack?: string
  }
  digest?: string
  componentStack?: string
}

/**
 * Format a Next.js error for logging
 */
export function formatNextError(error: Error & { digest?: string }): ErrorDetails {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    cause: error.cause instanceof Error ? {
      name: error.cause.name,
      message: error.cause.message,
      stack: error.cause.stack
    } : undefined
  }
}

/**
 * Format any error for logging
 */
function formatError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

class ErrorLogger {
  private logToConsole(entry: LogEntry) {
    const { timestamp, level, message, data } = entry
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, data)
        break
      case 'warn':
        console.warn(formattedMessage, data)
        break
      case 'info':
        console.info(formattedMessage, data)
        break
      default:
        console.debug(formattedMessage, data)
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? {
        ...data,
        error: data.error ? formatError(data.error) : undefined
      } : undefined
    }
  }

  debug(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry('debug', message, data)
    this.logToConsole(entry)
  }

  info(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, data)
    this.logToConsole(entry)
  }

  warn(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, data)
    this.logToConsole(entry)
  }

  error(message: string, data?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, data)
    this.logToConsole(entry)
  }
}

export const errorLogger = new ErrorLogger() 