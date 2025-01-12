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

// Add interface for previous schedule assignments
interface PreviousScheduleAssignments {
  date: string;
  assignments: Assignment[];
}

// Update ScheduleDetailsClientProps to include previous schedule assignments
interface ScheduleDetailsClientProps {
  schedule: Schedule;
  assignments: GroupedAssignments;
  error?: string | null;
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  approveSchedule: (scheduleId: string) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  previousScheduleAssignments?: PreviousScheduleAssignments;
}

// Add StaffingRequirements component
interface StaffingRequirementsProps {
  assignments: Assignment[];
  date: string;
  previousDayAssignments?: Assignment[];
}

// Update StaffingRequirements component to handle overnight shifts from previous day
function StaffingRequirements({ assignments, date, previousDayAssignments = [] }: StaffingRequirementsProps) {
  const timeBlocks = [
    { name: 'Early Morning', start: '05:00', end: '09:00', required: 6, supervisorRequired: 1 },
    { name: 'Day', start: '09:00', end: '21:00', required: 8, supervisorRequired: 1 },
    { name: 'Night', start: '21:00', end: '01:00', required: 7, supervisorRequired: 1 },
    { name: 'Overnight', start: '01:00', end: '05:00', required: 6, supervisorRequired: 1 }
  ];

  // Helper function to check if a shift overlaps with a time block
  function doesShiftOverlapBlock(shift: Shift, blockStart: string, blockEnd: string): boolean {
    const shiftStart = convertTimeToMinutes(shift.start_time);
    const shiftEnd = convertTimeToMinutes(shift.end_time);
    const blockStartMins = convertTimeToMinutes(blockStart);
    const blockEndMins = convertTimeToMinutes(blockEnd);

    // Handle overnight blocks (end time is less than start time)
    if (blockEndMins < blockStartMins) {
      // For overnight blocks, check if shift either:
      // 1. Starts before midnight and ends after block start
      // 2. Starts after midnight and ends before block end
      if (shiftEnd < shiftStart) {
        // Overnight shift
        return true; // Overnight shifts cover overnight blocks
      } else {
        return (shiftStart <= blockStartMins && shiftEnd > 0) || 
               (shiftStart >= 0 && shiftStart < blockEndMins);
      }
    }

    // Handle overnight shifts
    if (shiftEnd < shiftStart) {
      // Shift goes past midnight
      return (shiftStart <= blockStartMins) || (shiftEnd >= blockEndMins);
    }

    // Normal case: check if shift overlaps with block
    return (shiftStart < blockEndMins && shiftEnd > blockStartMins);
  }

  // Calculate coverage for each block, including overnight shifts from previous day
  const coverage = timeBlocks.map(block => {
    // Get assignments that overlap with this block
    const blockAssignments = assignments.filter(assignment => 
      doesShiftOverlapBlock(assignment.shift, block.start, block.end)
    );

    // For early morning blocks, also check previous day's overnight shifts
    let relevantPreviousAssignments: Assignment[] = [];
    if (block.name === 'Early Morning' || block.name === 'Overnight') {
      relevantPreviousAssignments = previousDayAssignments.filter(assignment => {
        const shiftEnd = convertTimeToMinutes(assignment.shift.end_time);
        return shiftEnd < convertTimeToMinutes(assignment.shift.start_time) && // Is overnight shift
               doesShiftOverlapBlock(assignment.shift, block.start, block.end);
      });
    }

    // Combine current and relevant previous assignments
    const allRelevantAssignments = [...blockAssignments, ...relevantPreviousAssignments];
    
    const supervisors = allRelevantAssignments.filter(a => a.is_supervisor_shift).length;
    const dispatchers = allRelevantAssignments.filter(a => !a.is_supervisor_shift).length;
    const total = supervisors + dispatchers;

    return {
      ...block,
      assigned: {
        total,
        supervisors,
        dispatchers
      },
      isMet: total >= block.required && supervisors >= block.supervisorRequired
    };
  });

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {coverage.map((block, index) => (
        <div key={index} className={`p-4 rounded-lg ${block.isMet ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">{block.name}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              block.isMet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {block.isMet ? 'Met' : 'Not Met'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Required:</p>
              <p>Total: {block.required}</p>
              <p>Sup: {block.supervisorRequired}</p>
              <p>Disp: {block.required - block.supervisorRequired}</p>
            </div>
            <div>
              <p className="text-gray-500">Assigned:</p>
              <p>Total: {block.assigned.total}</p>
              <p>Sup: {block.assigned.supervisors}</p>
              <p>Disp: {block.assigned.dispatchers}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to check if a time falls within a range
function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = convertTimeToMinutes(time);
  const startMinutes = convertTimeToMinutes(start);
  const endMinutes = convertTimeToMinutes(end);
  
  if (endMinutes < startMinutes) { // Handles overnight shifts
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  }
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Add helper types for shift grouping
interface ShiftGroup {
  name: string;
  startTime: string;
  assignments: {
    duration: number;
    assignments: Assignment[];
  }[];
}

// Add helper functions for shift grouping and sorting
function getShiftDuration(shift: Shift): number {
  const startTime = new Date(`1970-01-01T${shift.start_time}`);
  let endTime = new Date(`1970-01-01T${shift.end_time}`);
  if (endTime < startTime) {
    endTime = new Date(`1970-01-02T${shift.end_time}`);
  }
  return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
}

function groupAndSortShifts(shifts: Record<string, Assignment[]>): ShiftGroup[] {
  // First, group assignments by shift name
  const shiftGroups = new Map<string, Map<number, Assignment[]>>();
  const startTimes = new Map<string, string>();

  // Group shifts by name and duration
  Object.values(shifts).flat().forEach(assignment => {
    const shiftName = assignment.shift.name.replace(/ \(\d+h\)$/, ''); // Remove duration from name
    const duration = getShiftDuration(assignment.shift);
    
    if (!shiftGroups.has(shiftName)) {
      shiftGroups.set(shiftName, new Map());
      startTimes.set(shiftName, assignment.shift.start_time);
    }
    
    const durationMap = shiftGroups.get(shiftName)!;
    if (!durationMap.has(duration)) {
      durationMap.set(duration, []);
    }
    durationMap.get(duration)!.push(assignment);
  });

  // Convert to array and sort
  return Array.from(shiftGroups.entries())
    .map(([name, durationMap]) => ({
      name,
      startTime: startTimes.get(name)!,
      assignments: Array.from(durationMap.entries())
        .map(([duration, assignments]) => ({
          duration,
          assignments: assignments.sort((a, b) => 
            a.employee.last_name.localeCompare(b.employee.last_name)
          )
        }))
        .sort((a, b) => a.duration - b.duration)
    }))
    .sort((a, b) => {
      const timeA = convertTimeToMinutes(a.startTime);
      const timeB = convertTimeToMinutes(b.startTime);
      return timeA - timeB;
    });
}

// Add helper function to calculate and format time span
function formatTimeSpan(startTime: string, duration: number): string {
  const start = new Date(`1970-01-01T${startTime}`);
  let end = new Date(start.getTime() + duration * 60 * 60 * 1000);
  
  // Format times in 24-hour format
  const formatTime = (date: Date) => {
    return date.toTimeString().substring(0, 5);
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// Add TimelineView component
interface TimelineViewProps {
  assignments: Assignment[];
}

function TimelineView({ assignments }: TimelineViewProps) {
  // Create array of hour markers (00:00 to 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  // Add helper function for shift bar styling
  function getShiftBarStyle(shift: Shift): { left: string; width: string } {
    const startMinutes = convertTimeToMinutes(shift.start_time);
    let endMinutes = convertTimeToMinutes(shift.end_time);
    
    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const startPercent = (startMinutes / (24 * 60)) * 100;
    const durationPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    
    return {
      left: `${startPercent}%`,
      width: `${durationPercent}%`
    };
  }

  return (
    <div className="ml-4 flex-1">
      {/* Timeline header with hour markers */}
      <div className="flex border-b border-gray-200 text-xs text-gray-500">
        {hours.map((hour) => (
          <div key={hour} className="flex-1 text-center">
            {hour}
          </div>
        ))}
      </div>
      
      {/* Grid background */}
      <div className="relative">
        <div className="absolute inset-0 grid grid-cols-24 gap-px">
          {hours.map((hour) => (
            <div key={hour} className="h-full bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ScheduleDetailsClient({ 
  schedule, 
  assignments,
  error: initialError,
  timeRequirements,
  requirementStatuses,
  approveSchedule,
  deleteSchedule,
  previousScheduleAssignments
}: ScheduleDetailsClientProps) {
  const [error, setError] = useState<string | null>(initialError || null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Remove the grouping logic since assignments are already grouped
  const groupedAssignments = assignments;

  // Helper function for shift bar styling
  function getShiftBarStyle(shift: Shift): { left: string; width: string } {
    const startMinutes = convertTimeToMinutes(shift.start_time);
    let endMinutes = convertTimeToMinutes(shift.end_time);
    
    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const startPercent = (startMinutes / (24 * 60)) * 100;
    const durationPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    
    return {
      left: `${startPercent}%`,
      width: `${durationPercent}%`
    };
  }

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
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-3">
          <Link
            href={`/dashboard/schedules/edit/${schedule.id}`}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Edit Schedule
          </Link>
          <button
            onClick={() => handleApprove(schedule.id)}
            disabled={isApproving || schedule.status === 'published'}
            className="block rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving ? 'Publishing...' : 'Publish Schedule'}
          </button>
          <button
            onClick={() => handleDelete(schedule.id)}
            disabled={isDeleting}
            className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Schedule'}
          </button>
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
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {Object.entries(groupedAssignments).map(([date, shifts]) => {
              // Get previous day's assignments if available
              const previousDayAssignments = previousScheduleAssignments?.date === getPreviousDay(date) 
                ? previousScheduleAssignments.assignments 
                : [];

              return (
                <li key={date}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {new Date(date).toLocaleDateString()}
                      </h3>
                    </div>
                    
                    <StaffingRequirements 
                      assignments={Object.values(shifts).flat()} 
                      date={date}
                      previousDayAssignments={previousDayAssignments}
                    />

                    <div className="mt-4 space-y-6">
                      {groupAndSortShifts(shifts).map((group) => (
                        <div key={group.name} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                            {group.name}
                          </h4>
                          <div className="relative mt-4">
                            {/* Timeline header */}
                            <div className="absolute left-64 right-0 flex border-b border-gray-200">
                              {Array.from({ length: 24 }, (_, i) => (
                                <div key={i} className="flex-1 text-center text-xs text-gray-500">
                                  {`${i.toString().padStart(2, '0')}:00`}
                                </div>
                              ))}
                            </div>
                            
                            {/* Timeline grid */}
                            <div className="absolute left-64 right-0 top-6 bottom-0">
                              <div className="h-full grid grid-cols-24 gap-px bg-gray-200">
                                {Array.from({ length: 24 }, (_, i) => (
                                  <div key={i} className="bg-white" />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {group.assignments.map(({ duration, assignments }) => {
                            const timeSpan = formatTimeSpan(group.startTime, duration);
                            return (
                              <div key={duration} className="mt-8">
                                <h5 className="text-xs font-medium text-gray-500 mb-2">
                                  {duration}h Shift ({timeSpan})
                                </h5>
                                <div className="space-y-2">
                                  {assignments.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center">
                                      <div className="w-64 flex items-center space-x-3 text-sm">
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
                                      
                                      {/* Timeline bar */}
                                      <div className="relative flex-1 h-8">
                                        <div
                                          className={`absolute top-1 h-6 rounded ${
                                            assignment.is_supervisor_shift
                                              ? 'bg-purple-200'
                                              : 'bg-blue-200'
                                          } border border-opacity-50 ${
                                            assignment.is_supervisor_shift
                                              ? 'border-purple-300'
                                              : 'border-blue-300'
                                          }`}
                                          style={getShiftBarStyle(assignment.shift)}
                                        >
                                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                            {assignment.shift.start_time} - {assignment.shift.end_time}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Add CSS for grid columns */}
      <style jsx>{`
        .grid-cols-24 {
          grid-template-columns: repeat(24, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
}

// Helper function to get previous day's date
function getPreviousDay(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
} 