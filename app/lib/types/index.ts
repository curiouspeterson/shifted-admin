/**
 * Type Definitions Index
 * Last Updated: 2025-03-19
 * 
 * Central export point for all application types.
 * Organizes types by domain and provides a clear hierarchy.
 */

// Database Types
export * from './database/schema'  // Supabase generated types
export * from './database/models'  // Domain models
export * from './database/operations'  // Database operations

// API Types
export * from './api/requests'
export * from './api/responses'
export * from './api/handlers'

// UI Types
export * from './ui/components'
export * from './ui/forms'
export * from './ui/theme'

// Domain Types
export * from './scheduling/requirements'
export * from './scheduling/assignments'
export * from './scheduling/availability'

// Utility Types
export * from './utils/json'
export * from './utils/errors'
export * from './utils/validation' 