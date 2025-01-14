/**
 * Schedule Hook Module
 * Last Updated: 2024
 * 
 * Custom React hook for fetching and managing schedule data using SWR.
 * Provides real-time schedule data with automatic revalidation and
 * error handling.
 * 
 * Features:
 * - Automatic data fetching and caching
 * - Loading and error state management
 * - Type-safe data handling
 * - Database to client data mapping
 */

import useSWR from 'swr';
import type { Schedule } from '@/app/lib/types/scheduling';
import type { ScheduleSchema } from '../schemas/schedule';
import { mapDatabaseScheduleToClient } from '../database/mappers';

/**
 * Return type for useSchedule hook
 * 
 * @property schedule - The fetched schedule data or null if not available
 * @property isLoading - Whether the schedule is currently being fetched
 * @property isError - Whether an error occurred during fetching
 * @property error - Error message if any, null otherwise
 */
interface UseScheduleReturn {
  schedule: Schedule | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching schedule data
 * Uses SWR for data fetching with caching and revalidation
 * 
 * @param scheduleId - The ID of the schedule to fetch
 * @returns Object containing schedule data, loading state, and error information
 */
export function useSchedule(scheduleId: string): UseScheduleReturn {
  // Fetch schedule data using SWR
  const { data, error } = useSWR<{ data: ScheduleSchema | null; error: string | null }>(
    scheduleId ? `/api/schedules/${scheduleId}` : null
  );

  // Return processed schedule data with status information
  return {
    schedule: data?.data ? mapDatabaseScheduleToClient(data.data) : null,
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 