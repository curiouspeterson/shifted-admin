'use client';

import { useRouter } from 'next/navigation';
import { AssignmentForm } from '@/app/components/forms/AssignmentForm';
import type { AssignmentFormData } from '@/app/lib/schemas/forms';
import { createAssignment } from '@/app/lib/actions/assignment';
import { useSchedule } from '@/app/lib/hooks/useSchedule';
import { useScheduleAssignments } from '@/app/lib/hooks/useScheduleAssignments';
import { useEmployees } from '@/app/lib/hooks/useEmployees';
import { useShifts } from '@/app/lib/hooks/useShifts';

export default function NewAssignmentPage({ 
  params 
}: { 
  params: { id: string }
}) {
  const router = useRouter();
  const { schedule, isLoading: isLoadingSchedule } = useSchedule(params.id);
  const { rawAssignments, isLoading: isLoadingAssignments } = useScheduleAssignments(params.id);
  const { employees, isLoading: isLoadingEmployees } = useEmployees();
  const { shifts, isLoading: isLoadingShifts } = useShifts();

  const handleSubmit = async (data: AssignmentFormData) => {
    const result = await createAssignment(data);
    
    if (result.error) {
      // Handle error (you might want to show a toast notification)
      console.error('Failed to create assignment:', result.error);
      return;
    }

    // Navigate back to the schedule page
    router.push(`/dashboard/schedules/${params.id}`);
  };

  if (isLoadingSchedule || isLoadingAssignments || isLoadingEmployees || isLoadingShifts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-red-500">
        Schedule not found
      </div>
    );
  }

  // Filter out assignments with null employee_id or shift_id
  const existingAssignments = rawAssignments
    .filter(assignment => assignment.employee_id && assignment.shift_id)
    .map(assignment => ({
      employee_id: assignment.employee_id!,
      shift_id: assignment.shift_id!,
      date: assignment.date,
    }));

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Add New Assignment</h1>
      <AssignmentForm
        scheduleId={params.id}
        employees={employees || []}
        shifts={shifts || []}
        existingAssignments={existingAssignments}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 