/**
 * Schedule Assignments Hook Module
 * Last Updated: 2024
 * 
 * Custom React hook for fetching and managing schedule assignments using SWR.
 * Provides both raw assignments and assignments grouped by date, with automatic
 * revalidation and error handling.
 * 
 * Features:
 * - Automatic data fetching and caching
 * - Assignment data grouping by date
 * - Loading and error state management
 * - Type-safe data handling
 * - Database to client data mapping
 */

import useSWR from 'swr';
import type { Assignment } from '@/app/lib/types/scheduling';
import type { AssignmentSchema } from '../schemas/schedule';
import { mapRawAssignmentToAssignment } from '../database/mappers';

/**
 * Return type for useScheduleAssignments hook
 * 
 * @property assignments - Assignments grouped by date
 * @property rawAssignments - Flat array of all assignments
 * @property isLoading - Whether assignments are currently being fetched
 * @property isError - Whether an error occurred during fetching
 * @property error - Error message if any, null otherwise
 */
interface UseScheduleAssignmentsReturn {
  assignments: Record<string, Assignment[]>;
  rawAssignments: Assignment[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching schedule assignments
 * Uses SWR for data fetching with caching and revalidation
 * 
 * @param scheduleId - The ID of the schedule to fetch assignments for
 * @returns Object containing grouped assignments, raw assignments, loading state, and error information
 */
export function useScheduleAssignments(scheduleId: string): UseScheduleAssignmentsReturn {
  // Fetch assignments data using SWR
  const { data, error } = useSWR<{ data: AssignmentSchema[]; error: string | null }>(
    scheduleId ? `/api/schedules/${scheduleId}/assignments` : null
  );

  // Process raw assignments data, filtering out null values
  const rawAssignments = data?.data
    ? data.data.map(mapRawAssignmentToAssignment).filter((a): a is Assignment => a !== null)
    : [];

  // Group assignments by date for easier access
  const assignments = rawAssignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
    if (!acc[assignment.date]) {
      acc[assignment.date] = [];
    }
    acc[assignment.date].push(assignment);
    return acc;
  }, {});

  // Return processed assignments data with status information
  return {
    assignments,
    rawAssignments,
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 