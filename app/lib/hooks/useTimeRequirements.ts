/**
 * Time Requirements Hook Module
 * Last Updated: 2024
 * 
 * Custom React hook for fetching and managing time-based staffing requirements using SWR.
 * Provides both the requirements and their current status based on assignments,
 * with automatic revalidation and error handling.
 * 
 * Features:
 * - Automatic data fetching and caching
 * - Real-time requirement status calculation
 * - Loading and error state management
 * - Type-safe data handling
 * - Database to client data mapping
 */

import useSWR from 'swr';
import type { TimeBasedRequirement, Assignment } from '@/app/lib/types/scheduling';
import type { TimeBasedRequirementSchema } from '../schemas/schedule';
import { mapDatabaseRequirementToClient } from '../database/mappers';
import { calculateRequirementStatuses } from '../utils/schedule';
import type { RequirementStatus } from '../utils/schedule.types';

/**
 * Return type for useTimeRequirements hook
 * 
 * @property timeRequirements - List of time-based staffing requirements
 * @property requirementStatuses - Current status of each requirement based on assignments
 * @property isLoading - Whether requirements are currently being fetched
 * @property isError - Whether an error occurred during fetching
 * @property error - Error message if any, null otherwise
 */
interface UseTimeRequirementsReturn {
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching time-based requirements
 * Uses SWR for data fetching with caching and revalidation
 * 
 * @param scheduleId - The ID of the schedule to fetch requirements for
 * @param assignments - Current assignments to calculate requirement statuses
 * @returns Object containing requirements, their statuses, loading state, and error information
 */
export function useTimeRequirements(
  scheduleId: string,
  assignments: Assignment[] = []
): UseTimeRequirementsReturn {
  // Fetch requirements data using SWR
  const { data, error } = useSWR<{ data: TimeBasedRequirementSchema[]; error: string | null }>(
    scheduleId ? `/api/schedules/${scheduleId}/requirements` : null
  );

  // Map database requirements to client format
  const timeRequirements = data?.data
    ? data.data.map(mapDatabaseRequirementToClient)
    : [];

  // Calculate current status of each requirement based on assignments
  const requirementStatuses = calculateRequirementStatuses(assignments, timeRequirements);

  // Return processed requirements data with status information
  return {
    timeRequirements,
    requirementStatuses,
    isLoading: !error && !data,
    isError: error !== undefined || data?.error !== null,
    error: data?.error ?? null,
  };
} 