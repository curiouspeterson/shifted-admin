/**
 * Utils Module Index
 * Last Updated: 2024-01-15
 * 
 * This module exports all utility functions from various utility files.
 * It serves as the main entry point for importing utility functions.
 */

// Core utilities
export { cn, formatDate, formatTime, truncateText, generateId, debounce, deepClone, isEmpty } from './core'

// Error handling
export * from './errors'

// Data fetching
export * from './fetcher'

// Toast notifications
export * from './toast'

// Re-export offline utilities from their new location
export * from '@/app/lib/offline/utils/offline-storage'
export * from '@/app/lib/offline/utils/offline-fallback'
export * from '@/app/lib/offline/utils/service-worker'
export * from '@/app/lib/offline/utils/background-sync'
export * from '@/app/lib/offline/utils/indexed-db'
export * from '@/app/lib/offline/utils/network'

// Re-export schedule utilities from their new location
export * from '@/app/lib/scheduling/utils/schedule'
export type * from '@/app/lib/scheduling/utils/schedule.types' 