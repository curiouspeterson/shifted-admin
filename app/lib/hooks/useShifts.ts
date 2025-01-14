/**
 * Shifts Hook Module
 * Last Updated: 2024
 * 
 * Custom React hook for fetching and managing shift template data using SWR.
 * Provides real-time shift data with automatic revalidation and
 * error handling.
 * 
 * Features:
 * - Automatic data fetching and caching
 * - Loading and error state management
 * - Type-safe data handling
 * - Database to client data mapping
 */

import useSWR from 'swr';
import type { Shift } from '@/app/lib/types/scheduling';
import { mapDatabaseShiftToShift } from '../database/mappers';

/**
 * Return type for useShifts hook
 * 
 * @property shifts - List of all shift templates
 * @property isLoading - Whether shift data is currently being fetched
 * @property isError - Whether an error occurred during fetching
 * @property error - Error message if any, null otherwise
 */
interface UseShiftsReturn {
  shifts: Shift[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching shift template data
 * Uses SWR for data fetching with caching and revalidation
 * 
 * @returns Object containing shift data, loading state, and error information
 */
export function useShifts(): UseShiftsReturn {
  // Fetch shift data using SWR
  const { data, error } = useSWR<{ data: Shift[]; error: string | null }>(
    '/api/shifts'
  );

  // Return processed shift data with status information
  return {
    shifts: data?.data ? data.data.map(mapDatabaseShiftToShift) : [],
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 