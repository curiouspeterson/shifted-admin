import useSWR from 'swr';
import type { Assignment } from '@/app/types/scheduling';
import type { AssignmentSchema } from '../schemas/schedule';
import { mapRawAssignmentToAssignment } from '../database/mappers';

interface UseScheduleAssignmentsReturn {
  assignments: Record<string, Assignment[]>;
  rawAssignments: Assignment[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useScheduleAssignments(scheduleId: string): UseScheduleAssignmentsReturn {
  const { data, error } = useSWR<{ data: AssignmentSchema[]; error: string | null }>(
    scheduleId ? `/api/schedules/${scheduleId}/assignments` : null
  );

  const rawAssignments = data?.data
    ? data.data.map(mapRawAssignmentToAssignment).filter((a): a is Assignment => a !== null)
    : [];

  const assignments = rawAssignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
    if (!acc[assignment.date]) {
      acc[assignment.date] = [];
    }
    acc[assignment.date].push(assignment);
    return acc;
  }, {});

  return {
    assignments,
    rawAssignments,
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 