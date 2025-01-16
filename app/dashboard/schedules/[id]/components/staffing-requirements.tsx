/**
 * Staffing Requirements Component
 * Last Updated: 2024-01-16
 * 
 * A server component that displays staffing requirements and their status
 * for a specific date in the schedule.
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Assignment, TimeBasedRequirement } from '@/lib/types/scheduling'

interface StaffingRequirementsProps {
  scheduleId: string
  date: string
  assignments: Assignment[]
  timeRequirements: TimeBasedRequirement[]
}

export function StaffingRequirements({
  scheduleId,
  date,
  assignments,
  timeRequirements
}: StaffingRequirementsProps) {
  // Get day of week (0-6) from date
  const dayOfWeek = new Date(date).getDay()
  
  // Filter requirements for this day
  const todaysRequirements = timeRequirements.filter(
    req => req.day_of_week === dayOfWeek
  )

  if (todaysRequirements.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">No staffing requirements defined for this day.</p>
      </Card>
    )
  }

  // Sort requirements by start time
  const sortedRequirements = [...todaysRequirements].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  )

  return (
    <Card className="divide-y">
      {sortedRequirements.map((requirement) => {
        // Count assigned employees for this time block
        const assignedEmployees = assignments.filter(assignment => {
          if (!assignment.shift) return false
          
          const shiftStart = assignment.shift.start_time
          const shiftEnd = assignment.shift.end_time
          
          // Check if shift overlaps with requirement time block
          return (
            shiftStart <= requirement.end_time &&
            shiftEnd >= requirement.start_time
          )
        })

        // Count assigned supervisors
        const assignedSupervisors = assignedEmployees.filter(
          assignment => assignment.is_supervisor_shift
        )

        // Calculate status
        const employeeStatus = assignedEmployees.length < requirement.min_employees
          ? 'understaffed'
          : assignedEmployees.length > (requirement.max_employees || Infinity)
          ? 'overstaffed'
          : 'met'

        const supervisorStatus = assignedSupervisors.length < requirement.min_supervisors
          ? 'understaffed'
          : 'met'

        return (
          <div key={requirement.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {requirement.start_time} - {requirement.end_time}
                </h4>
                <p className="text-sm text-gray-500">
                  Required: {requirement.min_employees} employees
                  {requirement.max_employees && ` (max ${requirement.max_employees})`}
                  , {requirement.min_supervisors} supervisor{requirement.min_supervisors !== 1 && 's'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Badge
                  variant={
                    employeeStatus === 'understaffed'
                      ? 'destructive'
                      : employeeStatus === 'overstaffed'
                      ? 'secondary'
                      : 'success'
                  }
                >
                  {assignedEmployees.length} / {requirement.min_employees} employees
                </Badge>
                
                <Badge
                  variant={supervisorStatus === 'understaffed' ? 'destructive' : 'success'}
                >
                  {assignedSupervisors.length} / {requirement.min_supervisors} supervisors
                </Badge>
              </div>
            </div>
            
            {assignedEmployees.length > 0 && (
              <div className="mt-2">
                <ul className="space-y-1">
                  {assignedEmployees.map((assignment) => (
                    assignment.employee && (
                      <li key={assignment.id} className="text-sm">
                        {assignment.employee.first_name} {assignment.employee.last_name}
                        {assignment.is_supervisor_shift && (
                          <Badge variant="secondary" className="ml-2">
                            Supervisor
                          </Badge>
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