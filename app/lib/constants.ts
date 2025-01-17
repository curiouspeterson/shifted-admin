/**
 * Application Constants
 * Last Updated: 2025-03-19
 * 
 * Central location for all application constants.
 * Organized by domain and usage.
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const

// Cache Control
export const CACHE_CONTROL = {
  NO_CACHE: 'no-store, no-cache, must-revalidate',
  PUBLIC: 'public, max-age=31536000, immutable',
  PRIVATE: 'private, no-cache, no-store, must-revalidate',
} as const

// Rate Limiting
export const RATE_LIMITS = {
  AUTH: {
    points: 5,
    duration: 15 * 60, // 15 minutes
    blockDuration: 30 * 60, // 30 minutes
  },
  API: {
    points: 100,
    duration: 60, // 1 minute
    blockDuration: 5 * 60, // 5 minutes
  },
} as const

// Validation Constants
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
} as const

// Schedule Constants
export const SCHEDULE = {
  MIN_STAFF: 1,
  MAX_STAFF: 100,
  MIN_DURATION: 30, // minutes
  MAX_DURATION: 12 * 60, // 12 hours in minutes
} as const

// Time Constants
export const TIME = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
} as const

// API Constants
export const API = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SORT_ORDER: 'asc',
} as const

// Type the constants for better IDE support
export type HttpStatus = typeof HTTP_STATUS
export type ErrorCode = typeof ERROR_CODES
export type CacheControl = typeof CACHE_CONTROL
export type RateLimits = typeof RATE_LIMITS
export type ValidationRules = typeof VALIDATION
export type ScheduleRules = typeof SCHEDULE
export type TimeUnits = typeof TIME
export type ApiConfig = typeof API 