/**
 * Utils Module Index
 * Last Updated: 2025-01-16
 * 
 * This module exports all utility functions from their respective modules.
 * It serves as the main entry point for importing utility functions.
 */

// Core utilities
export { cn } from '@/utils/core/cn'
export { formatDate, formatTime, formatDateTime } from '@/utils/core/date'
export {
  truncateText,
  generateId,
  toTitleCase,
  toKebabCase,
  toCamelCase
} from '@/utils/core/string'
export {
  debounce,
  deepClone,
  isEmpty,
  clamp,
  isValidEmail
} from '@/utils/core/validation'

// API utilities
export { fetcher, mutationFetcher } from '@/utils/api/fetcher'
export type { FetcherOptions } from '@/utils/api/fetcher'
export { ApiError, ApiErrorCode, formatApiError } from '@/lib/errors/api'

// UI utilities
export {
  getFieldError,
  parseFormData,
  formatValidationErrors,
  createFormData
} from '@/utils/ui/form'
export { toast, toastMessages } from '@/utils/ui/toast'
export type { ToastOptions } from '@/utils/ui/toast'

// Note: Offline utilities are temporarily commented out until implemented
// export * from '@/lib/offline/utils/offline-storage'
// export * from '@/lib/offline/utils/offline-fallback'
// export * from '@/lib/offline/utils/service-worker'
// export * from '@/lib/offline/utils/background-sync'
// export * from '@/lib/offline/utils/indexed-db'
// export * from '@/lib/offline/utils/network'

// Note: Schedule utilities are temporarily commented out until implemented
// export * from '@/lib/scheduling/utils/schedule'
// export type * from '@/lib/scheduling/utils/schedule.types' 