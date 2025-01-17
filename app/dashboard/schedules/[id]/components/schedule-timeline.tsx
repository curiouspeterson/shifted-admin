/**
 * Schedule Timeline Component
 * Last Updated: 2024
 * 
 * A client-side component that provides a visual timeline representation of shifts
 * for a specific date. Shows shift blocks positioned on a 24-hour timeline with
 * hourly markers and shift details.
 * 
 * Features:
 * - 24-hour timeline with hour markers
 * - Visual shift blocks showing duration
 * - Shift name and assigned staff count
 * - Responsive layout
 * - Time-based positioning
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { Assignment } from '@/app/lib/types/scheduling';

/**
 * Props for the ScheduleTimeline component
 * @property date - The date for which to show the timeline
 * @property shifts - Object mapping shift IDs to arrays of assignments
 */
interface ScheduleTimelineProps {
  date: string;
  shifts: {
    [shiftId: string]: Assignment[];
  };
}

/**
 * ScheduleTimeline Component
 * Displays a visual timeline of shifts for a specific date, with
 * shift blocks positioned according to their start and end times.
 */
export default function ScheduleTimeline({ date, shifts }: ScheduleTimelineProps) {
  // Set up timeline boundaries for the given date
  const timelineStart = new Date(`${date}T00:00:00`);
  const timelineEnd = new Date(`${date}T23:59:59`);

  /**
   * Calculates the percentage position on the timeline for a given time
   * @param time - Time in HH:MM format
   * @returns Percentage position (0-100) on the timeline
   */
  const getTimelinePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-medium">Schedule Timeline</h3>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] border-l border-r border-gray-200">
          {/* Hour markers for the 24-hour timeline */}
          {Array.from({ length: 24 }).map((_, hour) => (
            <div
              key={hour}
              className="absolute top-0 h-full border-l border-gray-200"
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              <span className="absolute -top-6 -ml-3 text-xs text-gray-500">
                {`${hour.toString().padStart(2, '0')}:00`}
              </span>
            </div>
          ))}

          {/* Shift blocks showing assignments */}
          {Object.entries(shifts).map(([shiftId, assignments]) => {
            if (!assignments?.[0]?.shift) return null;
            
            const { start_time, end_time } = assignments[0].shift;
            const startPos = getTimelinePosition(start_time);
            const endPos = getTimelinePosition(end_time);
            const width = endPos - startPos;

            return (
              <div
                key={shiftId}
                className="absolute h-10 bg-blue-500 rounded-md opacity-75"
                style={{
                  left: `${startPos}%`,
                  width: `${width}%`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="p-2 text-xs text-white">
                  {assignments[0].shift.name} ({assignments.length})
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 