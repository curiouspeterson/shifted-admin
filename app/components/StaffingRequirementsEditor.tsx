/**
 * Staffing Requirements Editor Component
 * Last Updated: 2024
 * 
 * A complex form component for managing staffing requirements across different
 * time blocks and days of the week. Provides an intuitive interface for setting
 * minimum and maximum staff levels, including supervisor requirements.
 * 
 * Features:
 * - Day-based tab navigation
 * - Time block organization
 * - Min/max staff controls
 * - Supervisor requirements
 * - Real-time updates
 * - Loading states
 * - Optional edit mode
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TimeBasedRequirement } from '@/app/lib/types/scheduling';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Component Props Interface
 * @property requirements - Array of time-based staffing requirements
 * @property onUpdate - Callback function for updating a requirement
 * @property isEditable - Whether the requirements can be modified
 */
interface StaffingRequirementsEditorProps {
  requirements: TimeBasedRequirement[];
  onUpdate: (requirement: TimeBasedRequirement) => Promise<void>;
  isEditable?: boolean;
}

/**
 * Constants for days and time blocks
 * Defines the structure of the weekly schedule
 */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_BLOCKS = [
  { start: '05:00:00', end: '09:00:00', label: 'Early Morning (5 AM - 9 AM)' },
  { start: '09:00:00', end: '21:00:00', label: 'Day (9 AM - 9 PM)' },
  { start: '21:00:00', end: '01:00:00', label: 'Night (9 PM - 1 AM)' },
  { start: '01:00:00', end: '05:00:00', label: 'Overnight (1 AM - 5 AM)' }
];

/**
 * Staffing Requirements Editor Component
 * Provides an interface for viewing and editing staffing requirements
 * 
 * @param props - Component properties
 * @param props.requirements - Current staffing requirements
 * @param props.onUpdate - Update handler
 * @param props.isEditable - Edit mode flag
 * @returns A card-based editor for staffing requirements
 */
export function StaffingRequirementsEditor({
  requirements,
  onUpdate,
  isEditable = false
}: StaffingRequirementsEditorProps) {
  // Track loading state for individual requirements
  const [loading, setLoading] = React.useState<string | null>(null);

  /**
   * Finds a specific requirement based on day and time block
   * @param dayIndex - Index of the day (0-6)
   * @param start - Start time of the block
   * @param end - End time of the block
   * @returns The matching requirement or undefined
   */
  const getRequirement = (dayIndex: number, start: string, end: string) => {
    return requirements.find(r => 
      r.day_of_week === dayIndex && 
      r.start_time === start && 
      r.end_time === end
    );
  };

  /**
   * Handles updates to a requirement
   * Sets loading state during update and clears it after
   * @param requirement - The requirement to update
   */
  const handleUpdate = async (requirement: TimeBasedRequirement) => {
    try {
      setLoading(requirement.id);
      await onUpdate(requirement);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="w-full">
      {/* Header with title and description */}
      <CardHeader>
        <h2 className="text-lg font-semibold">Staffing Requirements</h2>
        <p className="text-sm text-muted-foreground">
          Set minimum staffing levels for each time block and day
        </p>
      </CardHeader>

      <CardContent>
        {/* Day-based tab navigation */}
        <Tabs defaultValue="0" className="w-full">
          {/* Tab list showing days of the week */}
          <TabsList className="grid grid-cols-7 w-full">
            {DAYS.map((day, index) => (
              <TabsTrigger key={day} value={index.toString()}>
                {day}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content panels for each day */}
          {DAYS.map((day, dayIndex) => (
            <TabsContent key={day} value={dayIndex.toString()}>
              <div className="space-y-6">
                {/* Time blocks for the selected day */}
                {TIME_BLOCKS.map(block => {
                  const req = getRequirement(dayIndex, block.start, block.end);
                  if (!req) return null;

                  return (
                    <div key={`${dayIndex}-${block.start}`} className="p-4 border rounded-lg">
                      {/* Time block header */}
                      <h3 className="font-medium mb-4">{block.label}</h3>

                      {/* Staffing controls grid */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Minimum Staff Control */}
                        <div className="space-y-2">
                          <Label>Minimum Staff</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={req.min_employees}
                              onChange={isEditable ? (e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseInt(e.target.value);
                                if (isNaN(value)) return;
                                handleUpdate({
                                  ...req,
                                  min_employees: value
                                });
                              } : undefined}
                              disabled={!isEditable || loading === req.id}
                              min={1}
                              className="w-24"
                            />
                          </div>
                        </div>

                        {/* Maximum Staff Control */}
                        <div className="space-y-2">
                          <Label>Maximum Staff</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={req.max_employees || ''}
                              onChange={isEditable ? (e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = e.target.value ? parseInt(e.target.value) : null;
                                handleUpdate({
                                  ...req,
                                  max_employees: value
                                });
                              } : undefined}
                              disabled={!isEditable || loading === req.id}
                              min={req.min_employees}
                              className="w-24"
                            />
                          </div>
                        </div>

                        {/* Minimum Supervisors Control */}
                        <div className="space-y-2">
                          <Label>Minimum Supervisors</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={req.min_supervisors}
                              onChange={isEditable ? (e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseInt(e.target.value);
                                if (isNaN(value)) return;
                                handleUpdate({
                                  ...req,
                                  min_supervisors: value
                                });
                              } : undefined}
                              disabled={!isEditable || loading === req.id}
                              min={1}
                              className="w-24"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default StaffingRequirementsEditor; 