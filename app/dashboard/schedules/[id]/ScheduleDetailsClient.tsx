'use client'

import { useState, useEffect } from 'react';
import type { Schedule, TimeBasedRequirement, ScheduleAssignment } from '../../../../lib/types/scheduling';
import type { RequirementStatus } from '../../../../lib/utils/schedule.types';
import ScheduleHeader from './components/ScheduleHeader';
import ScheduleTimeline from './components/ScheduleTimeline';
import { StaffingRequirements } from './components/StaffingRequirements';
import { Card } from '@/components/ui/card';

interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: ScheduleAssignment[];
  };
}

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
  error: initialError,
  timeRequirements,
  requirementStatuses
}: ScheduleDetailsClientProps) {
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  // Reset error when schedule changes
  useEffect(() => {
    setError(initialError);
  }, [initialError, schedule.id]);

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500 font-medium">
          Error loading schedule data: {error}
        </div>
      </Card>
    );
  }

  if (!assignments || Object.keys(assignments).length === 0) {
    return (
      <Card className="p-6">
        <div className="text-gray-500">
          No assignments found for this schedule.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <ScheduleHeader schedule={schedule} />
      
      {Object.entries(assignments).map(([date, shifts]) => {
        // Safely handle shifts object
        const allAssignments = shifts ? Object.values(shifts as Record<string, ScheduleAssignment[]>).flat() : [];
        
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
              error={error}
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