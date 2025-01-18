/**
 * New Schedule Page
 * Last Updated: 2025-03-19
 * 
 * Server Component for creating a new schedule.
 * Uses Suspense for loading states and error boundaries for error handling.
 */

import { Suspense } from 'react';
import { Spinner } from '@/app/components/ui/spinner';
import { ScheduleForm } from '@/app/components/schedule/schedule-form';

export default function NewSchedulePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Schedule</h1>
      
      <Suspense fallback={<Spinner size="lg" />}>
        <ScheduleForm 
          initialData={{
            title: '',
            description: '',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'draft'
          }}
          onSubmit={async (data) => {
            'use server';
            // Handle form submission
          }}
        />
      </Suspense>
    </div>
  );
} 