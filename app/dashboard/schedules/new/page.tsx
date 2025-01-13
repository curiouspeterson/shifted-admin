'use client';

import { useRouter } from 'next/navigation';
import { ScheduleForm } from '@/app/components/forms/ScheduleForm';
import type { ScheduleFormData } from '@/app/lib/schemas/forms';
import { createSchedule } from '@/app/lib/actions/schedule';

export default function NewSchedulePage() {
  const router = useRouter();

  const handleSubmit = async (data: ScheduleFormData) => {
    const result = await createSchedule(data);
    
    if (result.error) {
      // Handle error (you might want to show a toast notification)
      console.error('Failed to create schedule:', result.error);
      return;
    }

    // Navigate to the new schedule's page
    router.push(`/dashboard/schedules/${result.data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Schedule</h1>
      <ScheduleForm onSubmit={handleSubmit} />
    </div>
  );
} 