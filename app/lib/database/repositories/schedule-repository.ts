/**
 * Schedule Repository
 * Last Updated: 2024-01-15
 * 
 * Provides type-safe database operations for schedules.
 * Uses Supabase's query builder with runtime validation.
 */

import { SupabaseClient, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js'
import { Database } from '@/lib/database/database.types'
import { DatabaseError, ErrorCode } from '../base/errors'
import { Schedule, ScheduleInput } from '@/lib/schemas/schedule'
import { scheduleSchema } from '@/lib/schemas/schedule'
import {
  Row,
  TableName,
  createQueryBuilder,
  insertRow,
  updateRow,
  deleteRow,
  getRow,
  applyFilter,
  applyFilters,
  applyPagination,
  applyOrdering,
  Filter,
} from '../supabase/helpers'

// Type for schedule table
type ScheduleTable = 'schedules'
const TABLE_NAME: ScheduleTable = 'schedules'

// Type for schedule assignments
type ScheduleAssignment = {
  id: string
  employee: {
    id: string
    name: string
    role: string
  }
  shift: {
    id: string
    start_time: string
    end_time: string
  }
}

// Type for schedule with assignments
type ScheduleWithAssignments = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
  published_at: string | null
  published_by: string | null
  version: number
  assignments: ScheduleAssignment[] | null
}

// Type for find many options
interface FindManyOptions {
  filters?: Filter<ScheduleTable>[]
  page?: number
  perPage?: number
  orderBy?: keyof Row<ScheduleTable>
  ascending?: boolean
}

/**
 * Repository for managing schedules in the database.
 * Provides type-safe operations with runtime validation.
 */
export class ScheduleRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Create a query to fetch a schedule with its assignments
   */
  private createScheduleWithAssignmentsQuery(scheduleId: string) {
    return this.supabase
      .from(TABLE_NAME)
      .select(`
        *,
        assignments:schedule_assignments (
          id,
          employee:employees (
            id,
            name,
            role
          ),
          shift:shifts (
            id,
            start_time,
            end_time
          )
        )
      `)
      .eq('id', scheduleId)
      .single()
  }

  /**
   * Type guard for schedule assignments
   */
  private isValidAssignment(assignment: unknown): assignment is ScheduleAssignment {
    if (!assignment || typeof assignment !== 'object') return false
    
    const { id, employee, shift } = assignment as any
    
    if (!id || typeof id !== 'string') return false
    if (!employee || typeof employee !== 'object') return false
    if (!shift || typeof shift !== 'object') return false
    
    const { id: employeeId, name, role } = employee
    if (!employeeId || typeof employeeId !== 'string') return false
    if (!name || typeof name !== 'string') return false
    if (!role || typeof role !== 'string') return false
    
    const { id: shiftId, start_time, end_time } = shift
    if (!shiftId || typeof shiftId !== 'string') return false
    if (!start_time || typeof start_time !== 'string') return false
    if (!end_time || typeof end_time !== 'string') return false
    
    return true
  }

  /**
   * Type guard for schedule with assignments
   */
  private isValidScheduleWithAssignments(data: unknown): data is ScheduleWithAssignments {
    if (!data || typeof data !== 'object') return false
    
    const schedule = data as any
    
    // Validate base schedule fields
    if (!schedule.id || typeof schedule.id !== 'string') return false
    if (!schedule.name || typeof schedule.name !== 'string') return false
    if (schedule.description !== null && typeof schedule.description !== 'string') return false
    if (!schedule.start_date || typeof schedule.start_date !== 'string') return false
    if (!schedule.end_date || typeof schedule.end_date !== 'string') return false
    if (!schedule.status || typeof schedule.status !== 'string') return false
    if (typeof schedule.is_active !== 'boolean') return false
    
    // Validate assignments if present
    if (schedule.assignments !== null) {
      if (!Array.isArray(schedule.assignments)) return false
      return schedule.assignments.every((assignment: unknown) => this.isValidAssignment(assignment))
    }
    
    return true
  }

  /**
   * Find a schedule by ID
   */
  public async findById(id: string): Promise<Schedule> {
    const data = await getRow(this.supabase, TABLE_NAME, id)
    return this.validateSchedule(data)
  }

  /**
   * Find a schedule by ID with all its assignments
   */
  public async findByIdWithAssignments(id: string): Promise<ScheduleWithAssignments | null> {
    const { data, error } = await this.createScheduleWithAssignmentsQuery(id)

    if (error) {
      throw new DatabaseError(
        ErrorCode.NOT_FOUND,
        `Schedule with ID ${id} not found`,
        { id, originalError: error }
      )
    }

    if (!this.isValidScheduleWithAssignments(data)) {
      throw new DatabaseError(
        ErrorCode.VALIDATION_FAILED,
        'Invalid schedule or assignments data',
        { id }
      )
    }

    return data
  }

  /**
   * Find all schedules matching the given filters
   */
  public async findMany(options: FindManyOptions = {}): Promise<Schedule[]> {
    let query = createQueryBuilder(this.supabase, TABLE_NAME)

    if (options.filters?.length) {
      query = applyFilters(query, options.filters)
    }

    if (options.page && options.perPage) {
      query = applyPagination(query, options.page, options.perPage)
    }

    if (options.orderBy) {
      query = applyOrdering(query, options.orderBy, options.ascending)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError(
        ErrorCode.QUERY_FAILED,
        'Failed to fetch schedules',
        { originalError: error }
      )
    }

    return Promise.all((data || []).map(row => this.validateSchedule(row)))
  }

  /**
   * Create a new schedule
   */
  public async create(input: ScheduleInput): Promise<Schedule> {
    const dbData = this.mapToDbInsert(input)
    const data = await insertRow(this.supabase, TABLE_NAME, dbData)
    return this.validateSchedule(data)
  }

  /**
   * Update an existing schedule
   */
  public async update(id: string, input: Partial<ScheduleInput>): Promise<Schedule> {
    const dbData = this.mapToDbUpdate(input)
    const data = await updateRow(this.supabase, TABLE_NAME, id, dbData)
    return this.validateSchedule(data)
  }

  /**
   * Delete a schedule
   */
  public async delete(id: string): Promise<void> {
    await deleteRow(this.supabase, TABLE_NAME, id)
  }

  /**
   * Map schedule input to database insert format
   */
  private mapToDbInsert(input: ScheduleInput): Row<ScheduleTable> {
    const dbData = {
      name: input.name,
      description: input.description || null,
      start_date: input.startDate,
      end_date: input.endDate,
      status: input.status,
      is_active: input.isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: input.createdBy || null,
      updated_by: input.updatedBy || null,
      published_at: null,
      published_by: null,
      version: 1,
    }

    return dbData as Row<ScheduleTable>
  }

  /**
   * Map schedule input to database update format
   */
  private mapToDbUpdate(input: Partial<ScheduleInput>): Partial<Row<ScheduleTable>> {
    const dbData: Partial<Row<ScheduleTable>> = {}

    if (input.name !== undefined) dbData.name = input.name
    if (input.description !== undefined) dbData.description = input.description
    if (input.startDate !== undefined) dbData.start_date = input.startDate
    if (input.endDate !== undefined) dbData.end_date = input.endDate
    if (input.status !== undefined) dbData.status = input.status
    if (input.isActive !== undefined) dbData.is_active = input.isActive
    if (input.updatedBy !== undefined) dbData.updated_by = input.updatedBy

    dbData.updated_at = new Date().toISOString()

    return dbData
  }

  /**
   * Validate schedule data using Zod schema
   */
  private async validateSchedule(data: unknown): Promise<Schedule> {
    const result = await scheduleSchema.safeParseAsync(data)

    if (!result.success) {
      throw new DatabaseError(
        ErrorCode.VALIDATION_FAILED,
        'Invalid schedule data',
        { originalError: result.error }
      )
    }

    return result.data
  }
} 