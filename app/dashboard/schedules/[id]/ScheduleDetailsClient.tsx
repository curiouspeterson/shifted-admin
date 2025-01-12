'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Schedule,
  Employee,
  Shift,
  Assignment,
  ScheduleStatus,
  TimeBasedRequirement
} from '@/app/types/scheduling'

// Helper function to check if a time is between two times, handling overnight periods
const isTimeBetween = (time: string, start: string, end: string): boolean => {
  if (end < start) { // Overnight period
    return time >= start || time < end;
  }
  return time >= start && time < end;
};

// Helper function to check if a shift overlaps with a requirement period
const doesShiftOverlap = (shift: Shift, requirement: TimeBasedRequirement): boolean => {
  const shiftStart = shift.start_time;
  const shiftEnd = shift.end_time;
  const reqStart = requirement.start_time;
  const reqEnd = requirement.end_time;

  // If either the shift or requirement period crosses midnight
  if (shiftEnd < shiftStart || reqEnd < reqStart) {
    // For overnight shifts/requirements, check if any part overlaps
    if (shiftEnd < shiftStart && reqEnd < reqStart) {
      // Both shift and requirement are overnight
      return !(shiftEnd <= reqStart && shiftStart >= reqEnd);
    } else if (shiftEnd < shiftStart) {
      // Only shift is overnight
      return isTimeBetween(reqStart, shiftStart, shiftEnd) || 
             isTimeBetween(reqEnd, shiftStart, shiftEnd) ||
             (shiftStart <= reqStart && shiftEnd >= reqEnd);
    } else {
      // Only requirement is overnight
      return isTimeBetween(shiftStart, reqStart, reqEnd) ||
             isTimeBetween(shiftEnd, reqStart, reqEnd) ||
             (reqStart <= shiftStart && reqEnd >= shiftEnd);
    }
  }

  // Neither crosses midnight, simple overlap check
  return !(shiftEnd <= reqStart || shiftStart >= reqEnd);
};

interface RequirementStatus {
  requirement: TimeBasedRequirement;
  totalAssigned: number;
  supervisorsAssigned: number;
  dispatchersAssigned: number;
  isMet: boolean;
}

interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
}

interface ScheduleDetailsClientProps {
  schedule: Schedule;
  assignments: GroupedAssignments;
  error?: string | null;
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  approveSchedule: (scheduleId: string) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
}

export default function ScheduleDetailsClient({ 
  schedule, 
  assignments,
  error: initialError,
  timeRequirements,
  requirementStatuses,
  approveSchedule,
  deleteSchedule
}: ScheduleDetailsClientProps) {
  const [error, setError] = useState<string | null>(initialError || null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Remove the grouping logic since assignments are already grouped
  const groupedAssignments = assignments;

  const handleApprove = async (scheduleId: string) => {
    try {
      setIsApproving(true);
      setError(null);
      await approveSchedule(scheduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve schedule');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteSchedule(scheduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRequirementStatus = (
    shift: Shift,
    assignments: Assignment[],
    requirements: TimeBasedRequirement[]
  ): RequirementStatus | null => {
    // Find all requirements that overlap with this shift
    const overlappingReqs = requirements.filter(req => doesShiftOverlap(shift, req));
    
    if (overlappingReqs.length === 0) return null;

    // Use the most stringent requirement if multiple overlap
    const requirement = overlappingReqs.reduce((prev, curr) => {
      return (curr.min_total_staff > prev.min_total_staff) ? curr : prev;
    }, overlappingReqs[0]);

    const supervisors = assignments.filter(a => a.is_supervisor_shift).length;
    const dispatchers = assignments.filter(a => !a.is_supervisor_shift).length;
    const total = assignments.length;

    return {
      requirement,
      totalAssigned: total,
      supervisorsAssigned: supervisors,
      dispatchersAssigned: dispatchers,
      isMet: total >= requirement.min_total_staff &&
             supervisors >= requirement.min_supervisors &&
             dispatchers >= (requirement.min_total_staff - requirement.min_supervisors)
    };
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Schedule Details
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage schedule details and assignments
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href={`/dashboard/schedules/edit/${schedule.id}`}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Edit Schedule
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {timeRequirements.map((req, index) => {
            const status = requirementStatuses.find(
              s => s.requirement.start_time === req.start_time && 
                  s.requirement.end_time === req.end_time
            );
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {req.start_time} - {req.end_time}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    status?.isMet
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {status?.isMet ? 'Met' : 'Not Met'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Required</span>
                    <ul className="mt-1">
                      <li>Total: {req.min_total_staff}</li>
                      <li>Sup: {req.min_supervisors}</li>
                      <li>Disp: {req.min_total_staff - req.min_supervisors}</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned</span>
                    <ul className="mt-1">
                      <li>Total: {status?.totalAssigned || 0}</li>
                      <li>Sup: {status?.supervisorsAssigned || 0}</li>
                      <li>Disp: {status?.dispatchersAssigned || 0}</li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-md mt-6">
          <ul role="list" className="divide-y divide-gray-200">
            {Object.entries(groupedAssignments).map(([date, shifts]) => (
              <li key={date}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {new Date(date).toLocaleDateString()}
                    </h3>
                  </div>
                  <div className="mt-4 space-y-6">
                    {Object.entries(shifts).map(([shiftId, shiftAssignments]) => (
                      <div key={shiftId} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900">
                          {shiftAssignments[0]?.shift.name || 'Unknown Shift'}
                        </h4>
                        <div className="mt-2">
                          {shiftAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center space-x-3 text-sm">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                assignment.is_supervisor_shift
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {assignment.is_supervisor_shift ? 'Supervisor' : 'Dispatcher'}
                              </span>
                              <span className="text-gray-900">
                                {assignment.employee.first_name} {assignment.employee.last_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={() => handleDelete(schedule.id)}
          disabled={isDeleting}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {isDeleting ? 'Deleting...' : 'Delete Schedule'}
        </button>
        {schedule.status !== 'published' && (
          <button
            onClick={() => handleApprove(schedule.id)}
            disabled={isApproving}
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            {isApproving ? 'Publishing...' : 'Publish Schedule'}
          </button>
        )}
      </div>
    </div>
  );
} 