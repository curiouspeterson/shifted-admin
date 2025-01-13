import useSWR from 'swr';
import type { TimeBasedRequirement, Assignment } from '@/app/types/scheduling';
import type { TimeBasedRequirementSchema } from '../schemas/schedule';
import { mapDatabaseRequirementToClient } from '../database/mappers';
import { calculateRequirementStatuses } from '../utils/schedule';
import type { RequirementStatus } from '../utils/schedule.types';

interface UseTimeRequirementsReturn {
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useTimeRequirements(
  scheduleId: string,
  assignments: Assignment[] = []
): UseTimeRequirementsReturn {
  const { data, error } = useSWR<{ data: TimeBasedRequirementSchema[]; error: string | null }>(
    scheduleId ? `/api/schedules/${scheduleId}/requirements` : null
  );

  const timeRequirements = data?.data
    ? data.data.map(mapDatabaseRequirementToClient)
    : [];

  const requirementStatuses = calculateRequirementStatuses(assignments, timeRequirements);

  return {
    timeRequirements,
    requirementStatuses,
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 