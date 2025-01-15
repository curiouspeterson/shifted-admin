/**
 * Supabase Constants
 * Last Updated: 2024-03
 * 
 * This file contains constants used throughout the Supabase integration.
 * It includes configuration values, error codes, and other shared constants.
 */

/**
 * Authentication-related constants
 */
export const AUTH = {
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  },
  SESSION_EXPIRY: 60 * 60 * 24 * 7, // 7 days in seconds
  REFRESH_MARGIN: 60 * 5, // 5 minutes in seconds
} as const

/**
 * Database table names
 */
export const TABLES = {
  SCHEDULES: 'schedules',
  SHIFTS: 'shifts',
  EMPLOYEES: 'employees',
  PROFILES: 'profiles',
} as const

/**
 * Error codes for Supabase operations
 */
export const ERROR_CODES = {
  AUTH: {
    NO_SESSION: 'AUTH_NO_SESSION',
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  },
  DATABASE: {
    NOT_FOUND: 'DB_NOT_FOUND',
    DUPLICATE_KEY: 'DB_DUPLICATE_KEY',
    FOREIGN_KEY: 'DB_FOREIGN_KEY',
    VALIDATION: 'DB_VALIDATION',
    UNKNOWN: 'DB_UNKNOWN',
  },
  CONFIG: {
    MISSING_ENV: 'CONFIG_MISSING_ENV',
    INVALID_CONFIG: 'CONFIG_INVALID',
  },
} as const

/**
 * Status values for various entities
 */
export const STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

/**
 * Query-related constants
 */
export const QUERY = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_ORDER: 'created_at',
  DEFAULT_DIRECTION: 'desc' as const,
} as const

/**
 * Real-time subscription channels
 */
export const REALTIME = {
  CHANNELS: {
    SCHEDULE_UPDATES: 'schedule_updates',
    SHIFT_UPDATES: 'shift_updates',
    EMPLOYEE_UPDATES: 'employee_updates',
  },
  EVENTS: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
} as const

/**
 * Metadata field keys
 */
export const METADATA = {
  LAST_MODIFIED_BY: 'last_modified_by',
  MODIFICATION_REASON: 'modification_reason',
  VERSION: 'version',
  NOTES: 'notes',
} as const 