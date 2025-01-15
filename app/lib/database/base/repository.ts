/**
 * Base Repository
 * Last Updated: 2024-03-19 21:35 PST
 * 
 * This file provides the base repository class for database operations.
 */

import { createClient } from '@supabase/supabase-js';
import {
  DatabaseRecord,
  DatabaseResult,
  QueryFilters,
} from './types';
import { DatabaseError, ErrorCodes, mapDatabaseError } from './errors';
import { logger } from './logging';

export class BaseRepository<R extends DatabaseRecord> {
  protected readonly supabase;

  constructor(
    protected readonly tableName: string
  ) {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<DatabaseResult<R>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select()
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: mapDatabaseError(error) };
      }

      if (!data) {
        return {
          data: null,
          error: new DatabaseError(
            ErrorCodes.NOT_FOUND,
            `${this.tableName} not found with id: ${id}`
          ),
        };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by id`, { error });
      return { data: null, error: mapDatabaseError(error) };
    }
  }

  /**
   * Find multiple records with optional filters
   */
  async findMany(filters?: QueryFilters): Promise<DatabaseResult<R[]>> {
    try {
      let query = this.supabase.from(this.tableName).select();

      if (filters) {
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'limit') {
            query = query.limit(value as number);
          } else if (key === 'offset') {
            query = query.range(value as number, (value as number) + (filters.limit || 10));
          } else if (key === 'orderBy') {
            query = query.order(value as string, {
              ascending: filters.orderDirection !== 'desc',
            });
          } else if (value !== undefined) {
            // Handle special operators in key (e.g., field_gte, field_lte)
            const [field, operator] = key.split('_');
            if (operator) {
              switch (operator) {
                case 'gte':
                  query = query.gte(field, value);
                  break;
                case 'lte':
                  query = query.lte(field, value);
                  break;
                case 'gt':
                  query = query.gt(field, value);
                  break;
                case 'lt':
                  query = query.lt(field, value);
                  break;
                case 'neq':
                  query = query.neq(field, value);
                  break;
                case 'like':
                  query = query.like(field, value);
                  break;
                case 'ilike':
                  query = query.ilike(field, value);
                  break;
                default:
                  query = query.eq(field, value);
              }
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: mapDatabaseError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      logger.error(`Error finding ${this.tableName} records`, { error });
      return { data: [], error: mapDatabaseError(error) };
    }
  }

  /**
   * Create a new record
   */
  async create(input: Partial<R>): Promise<DatabaseResult<R>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(input)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapDatabaseError(error) };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Error creating ${this.tableName}`, { error });
      return { data: null, error: mapDatabaseError(error) };
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, input: Partial<R>): Promise<DatabaseResult<R>> {
    try {
      // Check if record exists and get current version
      const current = await this.findById(id);
      if (current.error) {
        return current;
      }

      // Handle optimistic locking
      if ('version' in input && current.data?.version !== input.version) {
        return {
          data: null,
          error: new DatabaseError(
            ErrorCodes.CONFLICT,
            'Record has been modified',
            { current: current.data?.version, attempted: input.version }
          ),
        };
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapDatabaseError(error) };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Error updating ${this.tableName}`, { error });
      return { data: null, error: mapDatabaseError(error) };
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return { data: undefined, error: mapDatabaseError(error) };
      }

      return { data: undefined, error: null };
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}`, { error });
      return { data: undefined, error: mapDatabaseError(error) };
    }
  }
} 