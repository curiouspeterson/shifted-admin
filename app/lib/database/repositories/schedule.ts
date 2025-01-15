/**
 * Schedule Repository
 * Last Updated: 2024-03-19 21:40 PST
 * 
 * This file provides the repository for managing schedules.
 */

import { BaseRepository } from '../base/repository';
import { DatabaseResult } from '../base/types';
import { Schedule } from '@/lib/schemas/schedule';

/**
 * Schedule repository
 */
export class ScheduleRepository extends BaseRepository<Schedule> {
  constructor() {
    super('schedules');
  }

  /**
   * Find schedules by date range
   */
  async findByDateRange(
    start_date: string,
    end_date: string
  ): Promise<DatabaseResult<Schedule[]>> {
    return this.findMany({
      start_date_gte: start_date,
      end_date_lte: end_date,
    });
  }

  /**
   * Find active schedules
   */
  async findActive(): Promise<DatabaseResult<Schedule[]>> {
    return this.findMany({
      is_active: true,
    });
  }

  /**
   * Find schedules by status
   */
  async findByStatus(
    status: Schedule['status']
  ): Promise<DatabaseResult<Schedule[]>> {
    return this.findMany({
      status,
    });
  }

  /**
   * Create a new schedule
   */
  async create(data: Partial<Schedule>): Promise<DatabaseResult<Schedule>> {
    // Convert null values to undefined
    const schedule = {
      ...data,
      created_by: data.created_by ?? undefined,
      updated_by: data.updated_by ?? undefined,
    };

    return super.create(schedule);
  }

  /**
   * Update a schedule
   */
  async update(
    id: string,
    data: Partial<Schedule>
  ): Promise<DatabaseResult<Schedule>> {
    // Convert null values to undefined
    const schedule = {
      ...data,
      created_by: data.created_by ?? undefined,
      updated_by: data.updated_by ?? undefined,
    };

    return super.update(id, schedule);
  }
} 