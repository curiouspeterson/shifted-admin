'use client'

import type { Schedule } from '@/app/types/scheduling';
import type { GroupedAssignments, RequirementStatus } from '@/app/lib/utils/schedule.types';
import type { TimeBasedRequirement } from '@/app/types/scheduling';
import ScheduleHeader from './components/ScheduleHeader';
import ScheduleTimeline from './components/ScheduleTimeline';
import StaffingRequirements from './components/StaffingRequirements';

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
  if (error) {
    return (
      <div className="text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ScheduleHeader schedule={schedule} />
      
      {Object.entries(assignments).map(([date, shifts]) => (
        <div key={date} className="space-y-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {new Date(date).toLocaleDateString()}
          </h3>
          
          <StaffingRequirements
            date={date}
            assignments={Object.values(shifts).flat()}
            timeRequirements={timeRequirements}
            requirementStatuses={requirementStatuses}
          />
          
          <ScheduleTimeline
            date={date}
            shifts={shifts}
          />
        </div>
      ))}
    </div>
  );
} 