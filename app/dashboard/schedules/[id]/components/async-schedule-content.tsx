/**
 * Async Schedule Content Component
 * Last Updated: 2024-03-21
 * 
 * Server Component that handles dynamic schedule content loading.
 * Uses streaming and suspense boundaries for optimal loading experience.
 */

import { Suspense } from 'react';
import { getAssignments, getTimeRequirements } from '../utils/data-fetching';
import { calculateRequirementStatuses } from '../utils/requirements';
import { TimelineLoader, RequirementsLoader } from './loading';
import ScheduleTimeline from './schedule-timeline';
import StaffingRequirements from './staffing-requirements';
import type { GroupedAssignments } from '@/lib/scheduling/utils/schedule.types';
import type { Assignment } from '@/lib/types/scheduling';

interface AsyncScheduleContentProps {
  scheduleId: string;
}

export default async function AsyncScheduleContent({ scheduleId }: AsyncScheduleContentProps) {
  // Fetch dynamic data in parallel
  const [assignmentsResponse, timeRequirementsResponse] = await Promise.all([
    getAssignments(scheduleId),
    getTimeRequirements(scheduleId)
  ]);
  
  if (assignmentsResponse.status === 'error') {
    throw new Error(assignmentsResponse.error.message);
  }
  
  if (timeRequirementsResponse.status === 'error') {
    throw new Error(timeRequirementsResponse.error.message || 'Failed to fetch time requirements');
  }
  
  const assignments = assignmentsResponse.status === 'success' ? assignmentsResponse.data : {} as GroupedAssignments;
  const timeRequirements = timeRequirementsResponse.status === 'success' ? timeRequirementsResponse.data : [];
  
  return (
    <>
      {Object.entries(assignments).map(([date, shifts]) => {
        const allAssignments = shifts ? Object.values(shifts).flat() : [];
        const requirementStatuses = calculateRequirementStatuses(date, allAssignments, timeRequirements);
        
        return (
          <div key={date} className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {new Date(date).toLocaleDateString()}
            </h3>
            
            <Suspense fallback={<RequirementsLoader />}>
              <StaffingRequirements
                scheduleId={scheduleId}
                date={date}
                assignments={allAssignments}
                timeRequirements={timeRequirements}
                requirementStatuses={requirementStatuses}
              />
            </Suspense>
            
            <Suspense fallback={<TimelineLoader />}>
              <ScheduleTimeline
                date={date}
                shifts={shifts as { [shiftId: string]: Assignment[] }}
              />
            </Suspense>
          </div>
        );
      })}
    </>
  );
} 