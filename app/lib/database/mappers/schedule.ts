/**
 * Schedule Type Mapper
 * Last Updated: 2024-01-15
 * 
 * Provides type-safe conversions between Schedule domain types and database types.
 */

import { 
  BaseTypeMapper, 
  Row, 
  Insert, 
  Update,
  asRow,
  asInsert,
  asUpdate
} from '../supabase/type-mapping'
import type { Schedule, ScheduleInput } from '@/lib/schemas/schedule'

// Schedule-specific types
type ScheduleTable = 'schedules'
type ScheduleRow = Row<ScheduleTable>
type ScheduleInsert = Insert<ScheduleTable>
type ScheduleUpdate = Update<ScheduleTable>

export class ScheduleTypeMapper extends BaseTypeMapper<
  ScheduleTable,
  Schedule,
  ScheduleInput
> {
  toRow(data: unknown): Schedule {
    const row = asRow<ScheduleTable>(data)
    
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status as Schedule['status'],
      isActive: row.is_active ?? false,
      createdAt: row.created_at!,
      updatedAt: row.updated_at!,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      publishedAt: row.published_at,
      publishedBy: row.published_by,
      version: row.version
    }
  }

  toDbInsert(data: ScheduleInput): ScheduleInsert {
    const insert = asInsert<ScheduleTable>({
      name: data.name,
      description: data.description,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
      is_active: data.isActive,
      created_by: data.createdBy,
      updated_by: data.updatedBy
    })

    return insert
  }

  toDbUpdate(data: Partial<ScheduleInput>): ScheduleUpdate {
    const update: Record<string, unknown> = {}

    if (data.name !== undefined) update.name = data.name
    if (data.description !== undefined) update.description = data.description
    if (data.startDate !== undefined) update.start_date = data.startDate
    if (data.endDate !== undefined) update.end_date = data.endDate
    if (data.status !== undefined) update.status = data.status
    if (data.isActive !== undefined) update.is_active = data.isActive
    if (data.updatedBy !== undefined) update.updated_by = data.updatedBy

    return asUpdate<ScheduleTable>(update)
  }

  validateDbData(data: unknown): data is ScheduleRow | ScheduleInsert | ScheduleUpdate {
    if (!data || typeof data !== 'object') {
      return false
    }

    // For row validation
    if ('id' in data) {
      return this.validateRequiredFields(data, [
        'id',
        'name',
        'start_date',
        'end_date',
        'status',
        'is_active'
      ])
    }

    // For insert validation
    if ('start_date' in data && 'end_date' in data && 'status' in data) {
      return true
    }

    // For update validation (all fields are optional)
    return true
  }
} 