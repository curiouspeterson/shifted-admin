'use client';

import type { Assignment } from '@/app/types/scheduling';

interface ScheduleTimelineProps {
  date: string;
  shifts: {
    [shiftId: string]: Assignment[];
  };
}

interface ShiftGroup {
  name: string;
  startTime: string;
  assignments: {
    duration: number;
    assignments: Assignment[];
  }[];
}

// Helper function to convert time to minutes
function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to get shift duration
function getShiftDuration(shift: { start_time: string; end_time: string }): number {
  const startTime = new Date(`1970-01-01T${shift.start_time}`);
  let endTime = new Date(`1970-01-01T${shift.end_time}`);
  if (endTime < startTime) {
    endTime = new Date(`1970-01-02T${shift.end_time}`);
  }
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  return duration;
}

// Helper function to format time span
function formatTimeSpan(startTime: string, duration: number): string {
  const start = new Date(`1970-01-01T${startTime}`);
  let end = new Date(start.getTime() + duration * 60 * 60 * 1000);
  
  // Format times in 24-hour format
  const formatTime = (date: Date) => {
    return date.toTimeString().substring(0, 5);
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// Helper function to group and sort shifts
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

// Helper function for shift bar styling
function getShiftBarStyle(shift: { start_time: string; end_time: string }): { left: string; width: string } {
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

export default function ScheduleTimeline({ date, shifts }: ScheduleTimelineProps) {
  return (
    <div className="mt-4 space-y-6">
      {Object.entries(shifts).map(([shiftId, assignments]) => {
        const shiftGroups = groupAndSortShifts({ [shiftId]: assignments });
        return shiftGroups.map((group) => (
          <div key={`${group.name}-${shiftId}`} className="bg-gray-50 p-4 rounded-lg">
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
        ));
      })}

      {/* Add CSS for grid columns */}
      <style jsx>{`
        .grid-cols-24 {
          grid-template-columns: repeat(24, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
} 