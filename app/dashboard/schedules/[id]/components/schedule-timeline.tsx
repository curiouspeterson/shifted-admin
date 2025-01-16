/**
 * Schedule Timeline Component
 * Last Updated: 2024-01-16
 * 
 * A server component that displays a timeline view of shifts and assignments
 * for a specific date in the schedule.
 */

import { Card } from '@/components/ui/card'
import type { Assignment } from '@/lib/types/scheduling'

interface ScheduleTimelineProps {
  date: string
  shifts: Record<string, Assignment[]>
}

export function ScheduleTimeline({ date, shifts }: ScheduleTimelineProps) {
  // Convert shifts object to sorted array of entries
  const sortedShifts = Object.entries(shifts || {}).sort(([a], [b]) => {
    const timeA = a.split('-')[0] // Get start time of shift A
    const timeB = b.split('-')[0] // Get start time of shift B
    return timeA.localeCompare(timeB)
  })

  if (sortedShifts.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">No shifts scheduled for this date.</p>
      </Card>
    )
  }

  return (
    <Card className="divide-y">
      {sortedShifts.map(([shiftId, assignments]) => {
        const [startTime, endTime] = shiftId.split('-')
        
        return (
          <div key={shiftId} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {startTime} - {endTime}
                </h4>
                <p className="text-sm text-gray-500">
                  {assignments.length} {assignments.length === 1 ? 'employee' : 'employees'} assigned
                </p>
              </div>
              
              <div className="flex -space-x-2">
                {assignments.map((assignment) => (
                  assignment.employee_id && (
                    <div
                      key={assignment.id}
                      className="relative inline-block h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white"
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {assignment.employee_id.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            {assignments.length > 0 && (
              <div className="mt-2">
                <ul className="space-y-1">
                  {assignments.map((assignment) => (
                    assignment.employee_id && (
                      <li key={assignment.id} className="text-sm">
                        {assignment.employee?.first_name} {assignment.employee?.last_name}
                        {assignment.overtime_hours && (
                          <span className="ml-2 text-gray-500">
                            ({assignment.overtime_hours}h overtime)
                          </span>
                        )}
                      </li>
                    )
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
} 