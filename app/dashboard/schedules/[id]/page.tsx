/**
 * Schedule Details Page Component
 * Last Updated: 2024
 * 
 * A client-side page component that displays detailed information about a specific schedule.
 * Manages data fetching and state synchronization between SWR hooks and global store.
 * 
 * Features:
 * - Dynamic schedule data loading based on ID
 * - Concurrent fetching of schedule, assignments, and time requirements
 * - Global state management with schedule store
 * - Loading and error state handling
 * - Responsive layout with client component rendering
 */

'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useSchedule } from '@/app/lib/hooks/useSchedule';
import { useScheduleAssignments } from '@/app/lib/hooks/useScheduleAssignments';
import { useTimeRequirements } from '@/app/lib/hooks/useTimeRequirements';
import { useScheduleStore } from '@/app/lib/providers/schedule-provider';
import ScheduleDetailsClient from './ScheduleDetailsClient';
import type { GroupedAssignments } from '@/app/lib/utils/schedule.types';
import type { Schedule, TimeBasedRequirement, Assignment } from '@/app/lib/types/scheduling';
import type { ScheduleStore } from '@/app/lib/stores/schedule-store';

/**
 * Schedule Details Page Component
 * Manages the data fetching and state management for a specific schedule view
 * 
 * @param params - Object containing the schedule ID from the dynamic route
 * @returns A detailed view of the schedule with assignments and requirements
 */
export default function ScheduleDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  
  // SWR hooks for concurrent data fetching
  const { schedule: rawSchedule, isLoading: isLoadingSchedule, isError: scheduleError, error: scheduleErrorMessage } = useSchedule(resolvedParams.id);
  const { assignments, rawAssignments: assignmentsList, isLoading: isLoadingAssignments, isError: assignmentsError, error: assignmentsErrorMessage } = useScheduleAssignments(resolvedParams.id);
  const { timeRequirements: rawRequirements, requirementStatuses, isLoading: isLoadingRequirements, isError: requirementsError, error: requirementsErrorMessage } = useTimeRequirements(resolvedParams.id, assignmentsList);

  // Store actions for global state management
  const setSchedule = useScheduleStore((state: ScheduleStore) => state.setSchedule);
  const setAssignments = useScheduleStore((state: ScheduleStore) => state.setAssignments);
  const setTimeRequirements = useScheduleStore((state: ScheduleStore) => state.setTimeRequirements);
  const setRequirementStatuses = useScheduleStore((state: ScheduleStore) => state.setRequirementStatuses);
  const setLoading = useScheduleStore((state: ScheduleStore) => state.setLoading);
  const setError = useScheduleStore((state: ScheduleStore) => state.setError);

  // Transform assignments into the expected format
  const transformedAssignments = assignments ? Object.entries(assignments).reduce<GroupedAssignments>((acc, [date, dateAssignments]) => {
    acc[date] = dateAssignments.reduce<{ [shiftId: string]: Assignment[] }>((shiftAcc, assignment) => {
      const shiftId = assignment.shift_id;
      if (shiftId) {
        if (!shiftAcc[shiftId]) {
          shiftAcc[shiftId] = [];
        }
        shiftAcc[shiftId].push(assignment);
      }
      return shiftAcc;
    }, {});
    return acc;
  }, {}) : {};

  // Transform schedule to include required properties
  const schedule: Schedule | null = rawSchedule ? {
    id: rawSchedule.id,
    start_date: rawSchedule.start_date,
    end_date: rawSchedule.end_date,
    status: rawSchedule.status,
    version: rawSchedule.version || 1,
    is_active: rawSchedule.is_active ?? false,
    created_by: rawSchedule.created_by || '',
    created_at: rawSchedule.created_at || new Date().toISOString(),
    published_at: rawSchedule.published_at || null,
    published_by: rawSchedule.published_by || null
  } : null;

  // Transform time requirements to match expected type
  const timeRequirements: TimeBasedRequirement[] = rawRequirements.map(req => ({
    id: req.id,
    schedule_id: resolvedParams.id,
    start_time: req.start_time,
    end_time: req.end_time,
    min_employees: req.min_employees,
    max_employees: req.max_employees,
    min_supervisors: req.min_supervisors,
    day_of_week: req.day_of_week,
    created_at: req.created_at || new Date().toISOString(),
    updated_at: req.updated_at || new Date().toISOString()
  }));

  // Sync fetched data with global store
  useEffect(() => {
    setSchedule(schedule);
    setAssignments(transformedAssignments);
    setTimeRequirements(timeRequirements);
    setRequirementStatuses(requirementStatuses);
  }, [schedule, transformedAssignments, timeRequirements, requirementStatuses, setSchedule, setAssignments, setTimeRequirements, setRequirementStatuses]);

  // Update global loading state
  useEffect(() => {
    setLoading(isLoadingSchedule || isLoadingAssignments || isLoadingRequirements);
  }, [isLoadingSchedule, isLoadingAssignments, isLoadingRequirements, setLoading]);

  // Update global error state
  useEffect(() => {
    const hasError = scheduleError || assignmentsError || requirementsError;
    const errorMessage = scheduleErrorMessage || assignmentsErrorMessage || requirementsErrorMessage;
    setError(hasError ? errorMessage || 'Error loading schedule data' : null);
  }, [scheduleError, assignmentsError, requirementsError, scheduleErrorMessage, assignmentsErrorMessage, requirementsErrorMessage, setError]);

  // Loading state display
  if (isLoadingSchedule || isLoadingAssignments || isLoadingRequirements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Error state display
  const hasError = scheduleError || assignmentsError || requirementsError;
  const errorMessage = scheduleErrorMessage || assignmentsErrorMessage || requirementsErrorMessage;
  if (hasError) {
    return (
      <div className="text-red-500">
        {errorMessage || 'Error loading schedule data'}
      </div>
    );
  }

  // Not found state
  if (!schedule) {
    return (
      <div className="text-red-500">
        Schedule not found
      </div>
    );
  }

  // Render client component with all required data
  return (
    <ScheduleDetailsClient
      schedule={schedule}
      assignments={transformedAssignments}
      error={null}
      timeRequirements={timeRequirements}
      requirementStatuses={requirementStatuses}
    />
  );
} 