/**
 * API Repositories
 * Last Updated: 2025-01-15
 * 
 * This module exports all repository-related functionality.
 */

import { createClient } from '@supabase/supabase-js';
import { ScheduleRepository } from './schedule';
import type {
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  ScheduleStatus,
  CreateScheduleBody,
  UpdateScheduleBody,
} from './schedule';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Export repositories
export const scheduleRepository = new ScheduleRepository(supabase);

// Export types
export type {
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  ScheduleStatus,
  CreateScheduleBody,
  UpdateScheduleBody,
}; 