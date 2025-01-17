/**
 * Central Types Module
 * Last Updated: 2025-03-19
 * 
 * Single source of truth for all application types.
 * Re-exports types from Supabase and adds application-specific types.
 */

import type { Database } from './database'

// Re-export database types
export type { Database }
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

/**
 * Schedule pattern types for employee scheduling
 * @enum {string}
 */
export enum ScheduleType {
  FourTenHour = 'four_ten',
  ThreeTwelvePlusFour = 'three_twelve_plus_four',
}

/**
 * Days of the week enum
 * @enum {string}
 */
export enum DayOfWeek {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
}

// Common types
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/**
 * Generic API response type
 * @template T - The type of data returned by the API
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  code?: string
  details?: Record<string, unknown>
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    timestamp?: string
  }
}

/**
 * User type representing an authenticated user
 */
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  metadata?: Record<string, unknown>
}

/**
 * Session type representing an active user session
 */
export interface Session {
  user: User
  token: string
  expiresAt: number
}

/**
 * Schedule type representing a work schedule
 */
export interface Schedule {
  id: string
  name: string
  startDate: string
  endDate: string
  type: ScheduleType
  status: Enums['schedule_status']
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * Time requirement type representing staffing requirements for a specific time period
 */
export interface TimeRequirement {
  id: string
  scheduleId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  minStaff: number
  requiresSupervisor: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * API error type with discriminated union for error handling
 */
export interface ApiError extends Error {
  name: 'ApiError' | 'ValidationError' | 'AuthError' | 'NetworkError'
  code: string
  status: number
  details?: Record<string, unknown> | undefined
}

/**
 * Request options type for API calls
 */
export interface RequestOptions {
  signal?: AbortSignal
  timeout?: number
  retries?: number
  headers?: Record<string, string>
} 