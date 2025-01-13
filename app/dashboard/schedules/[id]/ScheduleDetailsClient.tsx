'use client'

import { useState, useEffect } from 'react';
import type { Schedule, TimeBasedRequirement } from '@/app/lib/types/scheduling';
import type { GroupedAssignments, RequirementStatus } from '@/app/lib/utils/schedule.types';
import ScheduleHeader from './components/ScheduleHeader';
import ScheduleTimeline from './components/ScheduleTimeline';
import { StaffingRequirements } from './components/StaffingRequirements';

interface ScheduleDetailsClientProps {
  schedule: Schedule;
  assignments: GroupedAssignments;
  error: string | null;
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
}

export default function ScheduleDetailsClient({
  schedule,
  assignments,
  error,
  timeRequirements,
  requirementStatuses
}: ScheduleDetailsClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(error);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  if (localError) {
    return (
      <div className="text-red-500">
        {localError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScheduleHeader schedule={schedule} />
      
      {Object.entries(assignments).map(([date, shifts]) => {
        const allAssignments = Object.values(shifts as Record<string, any[]>).flat();
        return (
          <div key={date} className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {new Date(date).toLocaleDateString()}
            </h3>
            
            <StaffingRequirements
              scheduleId={schedule.id}
              date={date}
              assignments={allAssignments}
              timeRequirements={timeRequirements}
              requirementStatuses={requirementStatuses}
              isLoading={isLoading}
              error={localError}
            />
            
            <ScheduleTimeline
              date={date}
              shifts={shifts}
            />
          </div>
        );
      })}
    </div>
  );
} 