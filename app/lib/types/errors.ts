/**
 * Error Types
 * Last Updated: 2025-03-19
 * 
 * Defines types and enums for error handling.
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorReport {
  id: string
  message: string
  severity: ErrorSeverity
  timestamp: Date
  stackTrace?: string
  metadata?: Record<string, unknown>
}

export interface ErrorFilter {
  severity?: ErrorSeverity | null
  dateRange?: {
    from: Date
    to: Date
  } | null
  search?: string
} 