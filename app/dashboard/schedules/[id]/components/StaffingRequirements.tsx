'use client';

import type { Assignment, TimeBasedRequirement } from '@/app/types/scheduling';
import type { RequirementStatus } from '@/app/lib/utils/schedule';

interface StaffingRequirementsProps {
  date: string;
  assignments: Assignment[];
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
}

export default function StaffingRequirements({
  date,
  assignments,
  timeRequirements,
  requirementStatuses
}: StaffingRequirementsProps) {
  // Filter requirement statuses for the current time blocks
  const currentRequirementStatuses = requirementStatuses.filter(status => {
    const requirement = status.requirement;
    const reqStart = requirement.start_time;
    const reqEnd = requirement.end_time;

    // For overnight requirements, check if they start on this date
    if (reqEnd < reqStart) {
      const assignmentDate = new Date(date);
      const reqDate = new Date(assignmentDate);
      reqDate.setHours(parseInt(reqStart.split(':')[0]), parseInt(reqStart.split(':')[1]));
      return reqDate.toDateString() === assignmentDate.toDateString();
    }

    return true;
  });

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {currentRequirementStatuses.map((status, index) => (
        <div 
          key={index} 
          className={`p-4 rounded-lg ${status.isMet ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">
              {status.requirement.start_time} - {status.requirement.end_time}
            </h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              status.isMet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.isMet ? 'Met' : 'Not Met'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Required:</p>
              <p>Total: {status.requirement.min_total_staff}</p>
              <p>Sup: {status.requirement.min_supervisors}</p>
              <p>Disp: {status.requirement.min_total_staff - status.requirement.min_supervisors}</p>
            </div>
            <div>
              <p className="text-gray-500">Assigned:</p>
              <p>Total: {status.totalAssigned}</p>
              <p>Sup: {status.supervisorsAssigned}</p>
              <p>Disp: {status.dispatchersAssigned}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 