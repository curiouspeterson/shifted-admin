/**
 * Staffing Requirements Component
 * Last Updated: 2024-03-21
 * 
 * A client-side component that displays staffing requirements and current staffing levels
 * for different time blocks throughout the day. Shows requirements for both regular staff
 * and supervisors, with visual indicators for met/unmet requirements.
 * 
 * Features:
 * - Time block breakdown (Early Morning, Day, Night, Overnight)
 * - Required vs. actual staff counts
 * - Maximum staff limits
 * - Supervisor requirements tracking
 * - Loading states with skeleton UI
 * - Error handling and display
 * - Visual status indicators
 */

'use client';

import React, { useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { TimeBasedRequirement, Assignment } from '@/lib/types/scheduling';
import type { RequirementStatus } from '@/lib/scheduling/utils/schedule.types';

/**
 * Props for the StaffingRequirements component
 * @property scheduleId - ID of the schedule being viewed
 * @property date - The date for which to show requirements
 * @property assignments - List of staff assignments for the date
 * @property timeRequirements - List of time-based staffing requirements
 * @property requirementStatuses - Current status of staffing requirements
 * @property isLoading - Optional loading state indicator
 * @property error - Optional error message
 */
interface StaffingRequirementsProps {
  scheduleId: string;
  date: string;
  assignments: Assignment[];
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Predefined time blocks for staffing requirements
 * Each block includes start time, end time, and a human-readable label
 */
const TIME_BLOCKS = [
  { start: '05:00:00', end: '09:00:00', label: 'Early Morning (5 AM - 9 AM)' },
  { start: '09:00:00', end: '21:00:00', label: 'Day (9 AM - 9 PM)' },
  { start: '21:00:00', end: '01:00:00', label: 'Night (9 PM - 1 AM)' },
  { start: '01:00:00', end: '05:00:00', label: 'Overnight (1 AM - 5 AM)' }
];

/**
 * StaffingRequirements Component
 * Displays a card showing staffing requirements and current staffing levels
 * for different time blocks throughout the day.
 */
export function StaffingRequirements({
  scheduleId,
  date,
  assignments,
  timeRequirements,
  requirementStatuses,
  isLoading = false,
  error = null
}: StaffingRequirementsProps) {
  const dayOfWeek = new Date(date).getDay();

  // Debug logging for component props
  useEffect(() => {
    console.log('StaffingRequirements props:', {
      scheduleId,
      date,
      dayOfWeek,
      assignmentsCount: assignments?.length,
      timeRequirementsCount: timeRequirements?.length,
      requirementStatusesCount: requirementStatuses?.length,
      isLoading,
      error
    });
  }, [scheduleId, date, assignments, timeRequirements, requirementStatuses, isLoading, error]);

  // Error state display
  if (error) {
    console.log('StaffingRequirements error:', error);
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-lg font-semibold">Staffing Requirements</h2>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // Loading state with skeleton UI
  if (isLoading) {
    console.log('StaffingRequirements loading');
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-lg font-semibold">Staffing Requirements</h2>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Finds the requirement status for a specific time block
   * @param start - Start time of the block
   * @param end - End time of the block
   * @returns The requirement status object if found
   */
  const getRequirementStatus = (start: string, end: string) => {
    const status = requirementStatuses.find(
      status => 
        status.date === date &&
        status.timeBlock.start === start &&
        status.timeBlock.end === end
    );
    console.log('Requirement status lookup:', { start, end, status });
    return status;
  };

  /**
   * Finds the requirement definition for a specific time block
   * @param start - Start time of the block
   * @param end - End time of the block
   * @returns The requirement object if found
   */
  const getRequirement = (start: string, end: string) => {
    const requirement = timeRequirements.find(r => 
      r.day_of_week === dayOfWeek && 
      r.start_time === start && 
      r.end_time === end
    );
    console.log('Requirement lookup:', { start, end, requirement });
    return requirement;
  };

  // Render the staffing requirements card with time blocks
  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-lg font-semibold">Staffing Requirements</h2>
        <p className="text-sm text-muted-foreground">
          Current staffing levels for each time block
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {TIME_BLOCKS.map(block => {
            const req = getRequirement(block.start, block.end);
            const status = getRequirementStatus(block.start, block.end);
            if (!req || !status) {
              console.log('Missing requirement or status:', { block, req, status });
              return null;
            }

            const isMet = status.actual >= status.required;

            return (
              <div key={block.start} className="p-4 border rounded-lg">
                <h3 className="font-medium mb-4">{block.label}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Required Staff Section */}
                  <div className="space-y-2">
                    <Label>Required Staff</Label>
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-medium ${isMet ? 'text-green-600' : 'text-red-600'}`}>
                        {status.actual} / {status.required}
                      </div>
                    </div>
                  </div>
                  {/* Maximum Staff Section */}
                  <div className="space-y-2">
                    <Label>Maximum Staff</Label>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-medium">
                        {req.max_employees || '∞'}
                      </div>
                    </div>
                  </div>
                  {/* Required Supervisors Section */}
                  <div className="space-y-2">
                    <Label>Required Supervisors</Label>
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-medium ${
                        status.type === 'supervisor' && !isMet ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {status.type === 'supervisor' ? `${status.actual} / ${status.required}` : 'Met'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default StaffingRequirements; 