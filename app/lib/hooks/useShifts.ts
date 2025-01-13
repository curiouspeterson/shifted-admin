import useSWR from 'swr';
import type { Shift } from '@/app/types/scheduling';
import { mapDatabaseShiftToShift } from '../database/mappers';

interface UseShiftsReturn {
  shifts: Shift[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useShifts(): UseShiftsReturn {
  const { data, error } = useSWR<{ data: Shift[]; error: string | null }>(
    '/api/shifts'
  );

  return {
    shifts: data?.data ? data.data.map(mapDatabaseShiftToShift) : [],
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 