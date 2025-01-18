/**
 * Edit Schedule Page
 * Last Updated: 2025-03-19
 * 
 * Server Component for editing an existing schedule.
 * Uses Suspense for loading states and error boundaries for error handling.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Spinner } from '@/app/components/ui/spinner';
import { getScheduleDetails } from '../../[id]/utils/data-fetching';
import { ScheduleForm } from '@/app/components/schedule/schedule-form';

interface EditSchedulePageProps {
  params: {
    id: string;
  };
}

export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const scheduleResponse = await getScheduleDetails(params.id);
  
  if (scheduleResponse.status === 'notFound') {
    notFound();
  }
  
  if (scheduleResponse.status === 'error') {
    throw new Error(scheduleResponse.error.message);
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Edit Schedule</h1>
      
      <Suspense fallback={<Spinner size="lg" />}>
        <ScheduleForm 
          initialData={scheduleResponse.data}
          onSubmit={async (data) => {
            'use server';
            // Handle form submission
          }}
        />
      </Suspense>
    </div>
  );
} 