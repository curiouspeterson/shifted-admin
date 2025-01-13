'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TimeBasedRequirement } from '@/lib/types/scheduling';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StaffingRequirementsEditorProps {
  requirements: TimeBasedRequirement[];
  onUpdate: (requirement: TimeBasedRequirement) => Promise<void>;
  isEditable?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_BLOCKS = [
  { start: '05:00:00', end: '09:00:00', label: 'Early Morning (5 AM - 9 AM)' },
  { start: '09:00:00', end: '21:00:00', label: 'Day (9 AM - 9 PM)' },
  { start: '21:00:00', end: '01:00:00', label: 'Night (9 PM - 1 AM)' },
  { start: '01:00:00', end: '05:00:00', label: 'Overnight (1 AM - 5 AM)' }
];

export function StaffingRequirementsEditor({
  requirements,
  onUpdate,
  isEditable = false
}: StaffingRequirementsEditorProps) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const getRequirement = (dayIndex: number, start: string, end: string) => {
    return requirements.find(r => 
      r.day_of_week === dayIndex && 
      r.start_time === start && 
      r.end_time === end
    );
  };

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
      <CardHeader>
        <h2 className="text-lg font-semibold">Staffing Requirements</h2>
        <p className="text-sm text-muted-foreground">
          Set minimum staffing levels for each time block and day
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid grid-cols-7 w-full">
            {DAYS.map((day, index) => (
              <TabsTrigger key={day} value={index.toString()}>
                {day}
              </TabsTrigger>
            ))}
          </TabsList>
          {DAYS.map((day, dayIndex) => (
            <TabsContent key={day} value={dayIndex.toString()}>
              <div className="space-y-6">
                {TIME_BLOCKS.map(block => {
                  const req = getRequirement(dayIndex, block.start, block.end);
                  if (!req) return null;

                  return (
                    <div key={`${dayIndex}-${block.start}`} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4">{block.label}</h3>
                      <div className="grid grid-cols-3 gap-4">
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