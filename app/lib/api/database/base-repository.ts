/**
 * Base Repository
 * Last Updated: 2025-01-15
 * 
 * This module provides a base repository class with common database operations.
 * Features:
 * - Generic database operations (CRUD)
 * - Centralized error handling
 * - Advanced filtering capabilities
 * - Type-safe operations
 * - Task status tracking
 * - Performance monitoring
 * 
 * @template T - The table name type that extends keyof Tables
 */

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { Database } from '@/lib/supabase/database.types';
import { DatabaseError } from '@/lib/errors';
import { errorLogger } from '@/lib/logging/error-logger';
import { performance } from 'perf_hooks';

// Task Status Types
export type TaskStatus = 
  | 'pending'    // Initial state
  | 'processing' // Operation in progress
  | 'completed'  // Successfully completed
  | 'failed'     // Operation failed
  | 'retrying';  // Attempting retry

export interface TaskMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  retryCount: number;
  status: TaskStatus;
  error?: Error;
}

export interface TaskContext {
  operation: string;
  table: string;
  filters?: unknown;
  id?: string;
  metrics: TaskMetrics;
}

// Extended Schema Types
type Schema = Database['public'] & {
  Tables: {
    [K in keyof Database['public']['Tables']]: Database['public']['Tables'][K] & {
      Relationships: Array<{
        foreignKeyName: string;
        columns: string[];
        referencedRelation: string;
        referencedColumns: string[];
      }>;
    };
  };
};

type SchemaTable<T extends keyof Schema['Tables']> = Schema['Tables'][T];
type TableRow<T extends keyof Schema['Tables']> = Schema['Tables'][T]['Row'];

export type Tables = Schema['Tables'];
export type TableName = keyof Tables;
export type Row<T extends TableName> = TableRow<T>;
export type ColumnName<T extends TableName> = keyof Row<T> & string;
export type ColumnValue<T extends TableName, K extends ColumnName<T>> = Row<T>[K];

// Type helpers for filter operations
type FilterValue<T extends Record<string, unknown>, K extends keyof T> = T[K] | T[K][];

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
}

export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'like' 
  | 'ilike' 
  | 'in' 
  | 'contains' 
  | 'containedBy';

export interface Filter<T extends TableName, K extends ColumnName<T> = ColumnName<T>> {
  field: K;
  operator: FilterOperator;
  value: FilterValue<Row<T>, K>;
}

export interface QueryOptions<T extends TableName> {
  select?: string;
  filters?: Filter<T>[];
  pagination?: {
    page: number;
    perPage: number;
  };
  sorting?: {
    column: ColumnName<T>;
    direction: 'asc' | 'desc';
  };
}

type QueryBuilder<T extends Record<string, unknown>> = PostgrestFilterBuilder<Schema, T, T[]>;

/**
 * Base repository class that provides common database operations with type safety.
 * 
 * @template T - The table name type that extends keyof Tables
 */
export class BaseRepository<T extends TableName> {
  protected readonly tableName: T;
  protected readonly supabase: SupabaseClient<Database>;
  private taskMetrics: Map<string, TaskMetrics>;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(supabase: SupabaseClient<Database>, tableName: T) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.taskMetrics = new Map();
  }

  /**
   * Start tracking a new task
   * @param taskId - Unique identifier for the task
   * @returns The initial task metrics
   */
  protected startTask(taskId: string): TaskMetrics {
    const metrics: TaskMetrics = {
      startTime: performance.now(),
      retryCount: 0,
      status: 'pending'
    };
    this.taskMetrics.set(taskId, metrics);
    return metrics;
  }

  /**
   * Update task metrics
   * @param taskId - The task identifier
   * @param status - New status
   * @param error - Optional error
   */
  protected updateTaskMetrics(taskId: string, status: TaskStatus, error?: Error): void {
    const metrics = this.taskMetrics.get(taskId);
    if (!metrics) return;

    metrics.status = status;
    if (error) metrics.error = error;
    
    if (status === 'completed' || status === 'failed') {
      metrics.endTime = performance.now();
      metrics.duration = metrics.endTime - metrics.startTime;
    }

    this.taskMetrics.set(taskId, metrics);
  }

  /**
   * Get task metrics
   * @param taskId - The task identifier
   * @returns The task metrics or undefined if not found
   */
  public getTaskMetrics(taskId: string): TaskMetrics | undefined {
    return this.taskMetrics.get(taskId);
  }

  /**
   * Helper method to handle database operations with retries and metrics
   */
  protected async handleDatabaseOperation<R>(
    operation: () => Promise<{ data: R | null; error: PostgrestError | null }>,
    errorMessage: string,
    context: Omit<TaskContext, 'metrics'>
  ): Promise<DatabaseResult<R>> {
    const taskId = `${context.operation}-${Date.now()}`;
    const metrics = this.startTask(taskId);

    const executeWithRetry = async (attempt: number): Promise<DatabaseResult<R>> => {
      try {
        this.updateTaskMetrics(taskId, 'processing');
        const { data, error } = await operation();

        if (error) {
          throw error;
        }

        this.updateTaskMetrics(taskId, 'completed');
        return { data: data as R, error: null };
      } catch (error) {
        metrics.retryCount = attempt;
        
        if (attempt < this.MAX_RETRIES) {
          this.updateTaskMetrics(taskId, 'retrying', error as Error);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
          return executeWithRetry(attempt + 1);
        }

        const dbError = new DatabaseError(errorMessage, error as Error);
        this.updateTaskMetrics(taskId, 'failed', dbError);
        
        errorLogger.error(dbError, {
          ...context,
          metrics: this.getTaskMetrics(taskId),
          attempt
        });

        return { data: null, error: dbError };
      }
    };

    return executeWithRetry(1);
  }

  /**
   * Creates a new filter builder instance for the current table
   * @returns A typed query builder for the current table
   */
  protected createFilterBuilder(): QueryBuilder<Row<T>> {
    return this.supabase
      .from(this.tableName)
      .select() as QueryBuilder<Row<T>>;
  }

  /**
   * Type guard to check if a value is valid for a filter operation.
   * Note: This is used for runtime validation. Type assertions are used in filter operations
   * to maintain compatibility with Supabase's internal types.
   */
  protected isValidFilterValue<K extends ColumnName<T>>(
    field: K,
    value: unknown,
    operator: FilterOperator
  ): value is FilterValue<Row<T>, K> {
    if (value === null) return false;
    if (value === undefined) return false;

    const isArrayOperator = operator === 'in' || operator === 'contains' || operator === 'containedBy';
    if (isArrayOperator && !Array.isArray(value)) return false;

    const isStringOperator = operator === 'like' || operator === 'ilike';
    if (isStringOperator && typeof value !== 'string') return false;

    const isNumericOperator = operator === 'gt' || operator === 'gte' || operator === 'lt' || operator === 'lte';
    if (isNumericOperator) {
      const columnType = typeof (({} as Row<T>)[field]);
      if (columnType === 'number' && typeof value !== 'number') return false;
    }

    return true;
  }

  /**
   * Helper method to apply filters to a query.
   * Note: Type assertions are used to maintain compatibility with Supabase's internal types
   * while still providing type safety at the interface level.
   */
  protected applyFilters(
    query: QueryBuilder<Row<T>>,
    filters?: Filter<T>[]
  ): QueryBuilder<Row<T>> {
    if (!filters?.length) return query;

    return filters.reduce((acc, filter) => {
      const { field, operator, value } = filter;
      
      if (!this.isValidFilterValue(field, value, operator)) {
        errorLogger.warn(`Invalid filter value for operator: ${operator}`, {
          component: 'BaseRepository',
          operation: 'applyFilters',
          table: this.tableName,
          filter
        });
        return acc;
      }

      // Type assertions are necessary here to bridge the gap between our type system
      // and Supabase's internal types. The runtime validation above ensures type safety.
      const filterValue = value as any;

      switch (operator) {
        case 'eq':
          return acc.eq(field, filterValue);
        case 'neq':
          return acc.neq(field, filterValue);
        case 'gt':
          return acc.gt(field, filterValue);
        case 'gte':
          return acc.gte(field, filterValue);
        case 'lt':
          return acc.lt(field, filterValue);
        case 'lte':
          return acc.lte(field, filterValue);
        case 'like':
          return acc.like(field, filterValue as string);
        case 'ilike':
          return acc.ilike(field, filterValue as string);
        case 'in':
          return acc.in(field, filterValue as any[]);
        case 'contains':
          return acc.contains(field, filterValue as any[]);
        case 'containedBy':
          return acc.containedBy(field, filterValue as any[]);
        default:
          errorLogger.warn(`Unsupported filter operator: ${operator}`, {
            component: 'BaseRepository',
            operation: 'applyFilters',
            table: this.tableName,
            filter
          });
          return acc;
      }
    }, query);
  }

  /**
   * Find a record by ID
   * @param id - The ID of the record to find
   * @param options - Optional query options
   * @returns A promise that resolves to a DatabaseResult containing the record
   */
  async findById(id: string, options: Partial<QueryOptions<T>> = {}): Promise<DatabaseResult<Row<T>>> {
    if (!id) {
      return { data: null, error: new DatabaseError('ID is required', new Error('Invalid ID')) };
    }

    const operation = async () => {
      const response = await this.supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id)
        .single();

      return {
        data: response.data as Row<T> | null,
        error: response.error
      };
    };

    return this.handleDatabaseOperation<Row<T>>(
      operation,
      `Failed to find ${this.tableName} by ID`,
      {
        operation: 'findById',
        table: this.tableName,
        id
      }
    );
  }

  /**
   * Find all records matching the filters
   * @param options - Optional query options
   * @returns A promise that resolves to a DatabaseResult containing the records
   */
  async findAll(options: Partial<QueryOptions<T>> = {}): Promise<DatabaseResult<Row<T>[]>> {
    const operation = async () => {
      let query = this.createFilterBuilder();

      if (options.select) {
        query = query.select(options.select) as QueryBuilder<Row<T>>;
      }

      // Apply filters
      if (options.filters?.length) {
        query = this.applyFilters(query, options.filters);
      }

      // Apply pagination
      if (options.pagination) {
        const { page, perPage } = options.pagination;
        if (page < 1 || perPage < 1) {
          throw new Error('Invalid pagination parameters');
        }
        const start = (page - 1) * perPage;
        const end = start + perPage - 1;
        query = query.range(start, end);
      }

      // Apply sorting
      if (options.sorting) {
        const { column, direction } = options.sorting;
        query = query.order(column, { ascending: direction === 'asc' });
      }

      const response = await query;

      return {
        data: response.data,
        error: response.error
      };
    };

    return this.handleDatabaseOperation<Row<T>[]>(
      operation,
      `Failed to find ${this.tableName} records`,
      {
        operation: 'findAll',
        table: this.tableName
      }
    );
  }

  /**
   * Create a new record
   * @param data - The data to create the record with
   * @returns A promise that resolves to a DatabaseResult containing the created record
   */
  async create(data: Partial<Row<T>>): Promise<DatabaseResult<Row<T>>> {
    if (!data || Object.keys(data).length === 0) {
      return { data: null, error: new DatabaseError('Data is required', new Error('Invalid data')) };
    }

    const now = new Date().toISOString();
    const record = {
      ...data,
      created_at: now,
      updated_at: now,
    };

    const operation = async () => {
      const response = await this.supabase
        .from(this.tableName)
        .insert(record)
        .select()
        .single();

      return {
        data: response.data as Row<T> | null,
        error: response.error
      };
    };

    return this.handleDatabaseOperation<Row<T>>(
      operation,
      `Failed to create ${this.tableName} record`,
      {
        operation: 'create',
        table: this.tableName
      }
    );
  }

  /**
   * Update an existing record
   * @param id - The ID of the record to update
   * @param data - The data to update the record with
   * @returns A promise that resolves to a DatabaseResult containing the updated record
   */
  async update(id: string, data: Partial<Row<T>>): Promise<DatabaseResult<Row<T>>> {
    if (!id) {
      return { data: null, error: new DatabaseError('ID is required', new Error('Invalid ID')) };
    }

    if (!data || Object.keys(data).length === 0) {
      return { data: null, error: new DatabaseError('Data is required', new Error('Invalid data')) };
    }

    const record = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const operation = async () => {
      const response = await this.supabase
        .from(this.tableName)
        .update(record)
        .eq('id', id)
        .select()
        .single();

      return {
        data: response.data as Row<T> | null,
        error: response.error
      };
    };

    return this.handleDatabaseOperation<Row<T>>(
      operation,
      `Failed to update ${this.tableName} record`,
      {
        operation: 'update',
        table: this.tableName,
        id
      }
    );
  }

  /**
   * Delete a record
   * @param id - The ID of the record to delete
   * @returns A promise that resolves to a DatabaseResult
   */
  async delete(id: string): Promise<DatabaseResult<void>> {
    if (!id) {
      return { data: null, error: new DatabaseError('ID is required', new Error('Invalid ID')) };
    }

    const operation = async () => {
      const response = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      return {
        data: undefined,
        error: response.error
      };
    };

    return this.handleDatabaseOperation<void>(
      operation,
      `Failed to delete ${this.tableName} record`,
      {
        operation: 'delete',
        table: this.tableName,
        id
      }
    );
  }

  /**
   * Get performance metrics for all tasks
   * @returns Summary of task metrics
   */
  public getPerformanceMetrics() {
    const summary = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageDuration: 0,
      totalRetries: 0,
      successRate: 0,
      averageRetries: 0
    };

    let totalDuration = 0;
    const metrics = Array.from(this.taskMetrics.values());

    for (const metric of metrics) {
      summary.totalTasks++;
      summary.totalRetries += metric.retryCount;

      if (metric.status === 'completed') {
        summary.completedTasks++;
        if (metric.duration) totalDuration += metric.duration;
      } else if (metric.status === 'failed') {
        summary.failedTasks++;
      }
    }

    // Only calculate averages if there are tasks
    if (summary.completedTasks > 0) {
      summary.averageDuration = totalDuration / summary.completedTasks;
    }

    if (summary.totalTasks > 0) {
      summary.successRate = (summary.completedTasks / summary.totalTasks) * 100;
      summary.averageRetries = summary.totalRetries / summary.totalTasks;
    }

    return summary;
  }
} 