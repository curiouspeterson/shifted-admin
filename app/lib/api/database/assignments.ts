/**
 * Assignments Database Operations Module
 * Last Updated: 2024
 * 
 * This module provides type-safe database operations for the assignments table,
 * including CRUD operations, error handling, and query builders.
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { DatabaseError } from '@/lib/errors'

type Tables = Database['public']['Tables']
type Assignment = Tables['assignments']['Row']
type AssignmentInsert = Tables['assignments']['Insert']
type AssignmentUpdate = Tables['assignments']['Update']

interface QueryOptions {
  filter?: Partial<Record<keyof Assignment, string>>
  orderBy?: {
    column: keyof Assignment
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
}

export class AssignmentsOperations {
  private table = 'assignments'

  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<DatabaseResult<Assignment>> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select()
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error finding assignment by ID:', error)
      return { data: null, error: new DatabaseError('Failed to find assignment') }
    }
  }

  async findMany(options: QueryOptions = {}): Promise<DatabaseResult<Assignment[]>> {
    try {
      let query = this.supabase
        .from(this.table)
        .select()

      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Assignment, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(
          options.orderBy.column,
          { ascending: options.orderBy.ascending }
        )
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        )
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error finding assignments:', error)
      return { data: null, error: new DatabaseError('Failed to find assignments') }
    }
  }

  async create(data: AssignmentInsert): Promise<DatabaseResult<Assignment>> {
    try {
      const { data: created, error } = await this.supabase
        .from(this.table)
        .insert(data)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { data: created, error: null }
    } catch (error) {
      console.error('Error creating assignment:', error)
      return { data: null, error: new DatabaseError('Failed to create assignment') }
    }
  }

  async update(id: string, data: AssignmentUpdate): Promise<DatabaseResult<Assignment>> {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { data: updated, error: null }
    } catch (error) {
      console.error('Error updating assignment:', error)
      return { data: null, error: new DatabaseError('Failed to update assignment') }
    }
  }

  /**
   * Delete an assignment
   * Returns null on successful deletion
   */
  async delete(id: string): Promise<DatabaseResult<null>> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id', id) as { data: null; error: PostgrestError | null };

      if (error) {
        throw error
      }

      return { data: null, error: null }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      return { data: null, error: new DatabaseError('Failed to delete assignment') }
    }
  }
}