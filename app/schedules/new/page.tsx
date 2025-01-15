/**
 * New Schedule Page
 * Last Updated: 2024-03-20 02:30 PST
 * 
 * This page provides a form for creating new schedules.
 */

import { ScheduleForm } from '@/components/schedule/schedule-form';

export const metadata = {
  title: 'New Schedule',
  description: 'Create a new schedule',
};

export default function NewSchedulePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Schedule</h1>
        <ScheduleForm />
      </div>
    </div>
  );
} 