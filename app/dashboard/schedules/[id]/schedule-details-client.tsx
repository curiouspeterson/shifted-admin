/**
 * Schedule Details Client Component
 * Last Updated: 2024
 * 
 * A client-side component that displays detailed schedule information including
 * assignments, staffing requirements, and timeline views. Handles data validation,
 * error states, and real-time updates.
 * 
 * Features:
 * - Grouped assignment display by date and shift
 * - Interactive timeline visualization
 * - Staffing requirements validation
 * - Error handling and loading states
 * - Debug logging for development
 * 
 * Component Structure:
 * - ScheduleHeader: Shows schedule metadata
 * - StaffingRequirements: Displays and validates staffing levels
 * - ScheduleTimeline: Visual timeline of shifts and assignments
 * 
 * Data Flow:
 * 1. Receives schedule, assignments, and requirements as props
 * 2. Validates and processes assignment data
 * 3. Groups assignments by date and shift
 * 4. Renders appropriate view based on data state
 */

'use client'

import { useState, useEffect } from 'react';
import type { Schedule, TimeBasedRequirement, ScheduleAssignment } from '@/app/lib/types/scheduling';
import type { RequirementStatus } from '@/app/lib/utils/schedule.types';
import ScheduleHeader from './components/ScheduleHeader';
import ScheduleTimeline from './components/ScheduleTimeline';
import { StaffingRequirements } from './components/StaffingRequirements';
import { Card } from '@/components/ui/card';

/**
 * Interface for grouped assignments data structure
 * Organizes assignments hierarchically by date and shift
 */
interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: ScheduleAssignment[];
  };
}

/**
 * Props interface for ScheduleDetailsClient component
 * @property schedule - The schedule object containing metadata
 * @property assignments - Grouped assignments by date and shift
 * @property error - Initial error state if any
 * @property timeRequirements - Array of staffing requirements
 * @property requirementStatuses - Array of requirement validation statuses
 */
interface ScheduleDetailsClientProps {
  schedule: Schedule;
  assignments: GroupedAssignments;
  error: string | null;
  timeRequirements: TimeBasedRequirement[];
  requirementStatuses: RequirementStatus[];
}

/**
 * Schedule Details Client Component
 * Main component for displaying schedule details and assignments
 * 
 * @component
 * @param props - Component properties
 * @returns Rendered schedule details view
 */
export default function ScheduleDetailsClient({
  schedule,
  assignments,
  error: initialError,
  timeRequirements,
  requirementStatuses
}: ScheduleDetailsClientProps) {
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [validatedAssignments, setValidatedAssignments] = useState<GroupedAssignments | null>(null);

  /**
   * Debug logging effect
   * Logs component props for development debugging
   */
  useEffect(() => {
    console.log('ScheduleDetailsClient received props:', {
      scheduleId: schedule?.id,
      assignmentCount: assignments ? Object.keys(assignments).length : 0,
      timeRequirementsCount: timeRequirements?.length,
      requirementStatusesCount: requirementStatuses?.length,
      error: initialError
    });
  }, [schedule, assignments, timeRequirements, requirementStatuses, initialError]);

  /**
   * Assignment validation effect
   * Processes and validates incoming assignment data
   */
  useEffect(() => {
    try {
      console.log('Processing assignments:', assignments);
      
      if (!assignments) {
        console.log('No assignments provided');
        setValidatedAssignments(null);
        return;
      }

      // Validate assignments structure
      const validated: GroupedAssignments = {};
      Object.entries(assignments).forEach(([date, shifts]) => {
        if (!shifts || typeof shifts !== 'object') {
          console.log(`Invalid shifts for date ${date}:`, shifts);
          return;
        }
        
        validated[date] = {};
        Object.entries(shifts).forEach(([shiftId, shiftAssignments]) => {
          if (!Array.isArray(shiftAssignments)) {
            console.log(`Invalid assignments for shift ${shiftId}:`, shiftAssignments);
            return;
          }
          validated[date][shiftId] = shiftAssignments.filter(assignment => {
            const isValid = assignment && 
              typeof assignment === 'object' && 
              'id' in assignment &&
              'employee_id' in assignment &&
              'shift_id' in assignment;
            
            if (!isValid) {
              console.log('Invalid assignment:', assignment);
            }
            return isValid;
          });
        });
      });

      console.log('Validated assignments:', validated);
      setValidatedAssignments(validated);
      setError(null);
    } catch (err) {
      console.error('Error validating assignments:', err);
      setError('Error processing schedule data');
      setValidatedAssignments(null);
    }
  }, [assignments]);

  /**
   * Error reset effect
   * Resets error state when schedule changes
   */
  useEffect(() => {
    setError(initialError);
  }, [initialError, schedule.id]);

  // Error state view
  if (error) {
    console.log('Rendering error state:', error);
    return (
      <Card className="p-6">
        <div className="text-red-500 font-medium">
          Error loading schedule data: {error}
        </div>
      </Card>
    );
  }

  // Empty state view
  if (!validatedAssignments || Object.keys(validatedAssignments).length === 0) {
    console.log('Rendering empty state');
    return (
      <Card className="p-6">
        <div className="text-gray-500">
          No assignments found for this schedule.
        </div>
      </Card>
    );
  }

  // Main schedule details view
  return (
    <div className="space-y-8">
      <ScheduleHeader schedule={schedule} />
      
      {Object.entries(validatedAssignments).map(([date, shifts]) => {
        // Safely handle shifts object
        const allAssignments = shifts ? Object.values(shifts).flat() : [];
        
        return (
          <div key={date} className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {new Date(date).toLocaleDateString()}
            </h3>
            
            <StaffingRequirements
              scheduleId={schedule.id}
              date={date}
              assignments={allAssignments}
              timeRequirements={timeRequirements}
              requirementStatuses={requirementStatuses}
              isLoading={isLoading}
              error={error}
            />
            
            <ScheduleTimeline
              date={date}
              shifts={shifts}
            />
          </div>
        );
      })}
    </div>
  );
} 