'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { ScheduleAssignment } from '@/app/lib/types/scheduling';

interface ScheduleTimelineProps {
  date: string;
  shifts: {
    [shiftId: string]: ScheduleAssignment[];
  };
}

export default function ScheduleTimeline({ date, shifts }: ScheduleTimelineProps) {
  const timelineStart = new Date(`${date}T00:00:00`);
  const timelineEnd = new Date(`${date}T23:59:59`);

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
          {/* Time markers */}
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

          {/* Shift blocks */}
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