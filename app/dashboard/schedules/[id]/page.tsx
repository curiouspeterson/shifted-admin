'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useSchedule } from '@/app/lib/hooks/useSchedule';
import { useScheduleAssignments } from '@/app/lib/hooks/useScheduleAssignments';
import { useTimeRequirements } from '@/app/lib/hooks/useTimeRequirements';
import { useScheduleStore } from '@/app/lib/providers/schedule-provider';
import ScheduleDetailsClient from './ScheduleDetailsClient';

export default function ScheduleDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  
  // SWR hooks for data fetching
  const { schedule, isLoading: isLoadingSchedule, isError: scheduleError, error: scheduleErrorMessage } = useSchedule(resolvedParams.id);
  const { assignments, rawAssignments, isLoading: isLoadingAssignments, isError: assignmentsError, error: assignmentsErrorMessage } = useScheduleAssignments(resolvedParams.id);
  const { timeRequirements, requirementStatuses, isLoading: isLoadingRequirements, isError: requirementsError, error: requirementsErrorMessage } = useTimeRequirements(resolvedParams.id, rawAssignments);

  // Store actions
  const setSchedule = useScheduleStore(state => state.setSchedule);
  const setAssignments = useScheduleStore(state => state.setAssignments);
  const setTimeRequirements = useScheduleStore(state => state.setTimeRequirements);
  const setRequirementStatuses = useScheduleStore(state => state.setRequirementStatuses);
  const setLoading = useScheduleStore(state => state.setLoading);
  const setError = useScheduleStore(state => state.setError);

  // Update store when data changes
  useEffect(() => {
    setSchedule(schedule);
    setAssignments(assignments);
    setTimeRequirements(timeRequirements);
    setRequirementStatuses(requirementStatuses);
  }, [schedule, assignments, timeRequirements, requirementStatuses, setSchedule, setAssignments, setTimeRequirements, setRequirementStatuses]);

  // Update loading state
  useEffect(() => {
    setLoading(isLoadingSchedule || isLoadingAssignments || isLoadingRequirements);
  }, [isLoadingSchedule, isLoadingAssignments, isLoadingRequirements, setLoading]);

  // Update error state
  useEffect(() => {
    const hasError = scheduleError || assignmentsError || requirementsError;
    const errorMessage = scheduleErrorMessage || assignmentsErrorMessage || requirementsErrorMessage;
    setError(hasError ? errorMessage || 'Error loading schedule data' : null);
  }, [scheduleError, assignmentsError, requirementsError, scheduleErrorMessage, assignmentsErrorMessage, requirementsErrorMessage, setError]);

  if (isLoadingSchedule || isLoadingAssignments || isLoadingRequirements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const hasError = scheduleError || assignmentsError || requirementsError;
  const errorMessage = scheduleErrorMessage || assignmentsErrorMessage || requirementsErrorMessage;
  if (hasError) {
    return (
      <div className="text-red-500">
        {errorMessage || 'Error loading schedule data'}
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-red-500">
        Schedule not found
      </div>
    );
  }

  return (
    <ScheduleDetailsClient
      schedule={schedule}
      assignments={assignments}
      error={null}
      timeRequirements={timeRequirements}
      requirementStatuses={requirementStatuses}
    />
  );
} 