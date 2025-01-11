'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

// Add type definitions for your data
type Schedule = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
};

type Shift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  crosses_midnight: boolean;
};

type Assignment = {
  id: string;
  date: string;
  employee: Employee;
  shift: Shift;
  is_supervisor_shift: boolean;
};

interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
}

interface ScheduleDetailsClientProps {
  schedule: Schedule | null;
  assignments: GroupedAssignments;
  error: string | null;
}

export default function ScheduleDetailsClient({ schedule, assignments, error }: ScheduleDetailsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scheduleId, setScheduleId] = useState<string | null>(null);

  // Extract schedule ID from pathname
  useEffect(() => {
    const pathParts = pathname?.split('/');
    const id = pathParts && pathParts[pathParts.length - 1];
    setScheduleId(id || null);
  }, [pathname]);

  const handleEdit = () => {
    if (scheduleId) {
        router.push(`/dashboard/schedules/edit/${scheduleId}`);
    }
  };

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error || 'Schedule not found'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{schedule.name}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleEdit}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Schedule
            </button>
          </div>
        </div>

        {/* Schedule Status */}
        <div className="mb-8 rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Status</h2>
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                schedule.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assignments</h2>
          {Object.entries(assignments).sort().map(([date, shifts]) => (
            <div key={date} className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">
                {new Date(date).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {Object.entries(shifts).map(([shiftId, shiftAssignments]) => {
                    const shift = shiftAssignments[0]?.shift
                    return (
                      <li key={shiftId}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {shift?.name} ({shift?.start_time} - {shift?.end_time})
                            </h4>
                          </div>
                          <ul className="space-y-2">
                            {shiftAssignments.map((assignment: Assignment) => (
                              <li key={assignment.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-900">
                                    {assignment.employee.first_name} {assignment.employee.last_name}
                                  </span>
                                  {assignment.is_supervisor_shift && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                      Supervisor
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 