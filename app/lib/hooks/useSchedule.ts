import useSWR from 'swr';
import type { Schedule } from '@/app/types/scheduling';
import type { ScheduleSchema } from '../schemas/schedule';
import { mapDatabaseScheduleToClient } from '../database/mappers';

interface UseScheduleReturn {
  schedule: Schedule | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useSchedule(scheduleId: string): UseScheduleReturn {
  const { data, error } = useSWR<{ data: ScheduleSchema | null; error: string | null }>(
    scheduleId ? `/api/schedules/${scheduleId}` : null
  );

  return {
    schedule: data?.data ? mapDatabaseScheduleToClient(data.data) : null,
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 