/**
 * Schedule Type Mapper
 * Last Updated: 2024-01-15
 * 
 * Handles type mapping between domain and database types for schedules.
 */

import { Database } from '@/lib/database/database.types'

type ScheduleTable = 'schedules'
type ScheduleRow = Database['public']['Tables'][ScheduleTable]['Row']
type ScheduleInsert = Database['public']['Tables'][ScheduleTable]['Insert']
type ScheduleUpdate = Database['public']['Tables'][ScheduleTable]['Update']

export interface Schedule {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  status: string
  isActive: boolean
  metadata: Record<string, any> | null
  createdAt: string | null
  updatedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  publishedAt: string | null
  publishedBy: string | null
  version: number
}

export interface ScheduleInput {
  name: string
  description?: string | null
  startDate: string
  endDate: string
  status: string
  isActive?: boolean
  metadata?: Record<string, any> | null
}

/**
 * Converts domain schedule data to database format
 */
export function toDbSchedule(data: ScheduleInput): ScheduleInsert {
  return {
    name: data.name,
    description: data.description,
    start_date: data.startDate,
    end_date: data.endDate,
    status: data.status,
    is_active: data.isActive ?? true,
    metadata: data.metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1
  }
}

/**
 * Converts database schedule data to domain format
 */
export function toDomainSchedule(data: ScheduleRow): Schedule {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    isActive: data.is_active,
    metadata: data.metadata as Record<string, any> | null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    publishedAt: data.published_at,
    publishedBy: data.published_by,
    version: data.version
  }
} 