'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScheduleForm } from '@/app/components/forms/ScheduleForm';
import type { ScheduleFormData } from '@/app/lib/schemas/forms';
import { createSchedule } from '@/app/lib/actions/schedule';

export default function NewSchedulePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ScheduleFormData) => {
    setError(null);
    const result = await createSchedule(data);
    
    if (result.error) {
      console.error('Failed to create schedule:', result.error);
      setError(result.error);
      return;
    }

    if (!result.data) {
      console.error('No schedule data returned');
      setError('Failed to create schedule');
      return;
    }

    // Navigate to the new schedule's page
    router.push(`/dashboard/schedules/${result.data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Schedule</h1>
      {error && (
        <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      <ScheduleForm onSubmit={handleSubmit} />
    </div>
  );
} 