/**
 * New Assignment Page Component
 * Last Updated: 2024-01-16
 * 
 * This page provides an interface for creating new schedule assignments,
 * allowing supervisors to assign employees to specific shifts on specific dates.
 */

'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AssignmentForm } from '@/components/forms/AssignmentForm';
import { createAssignment } from '@/lib/actions/assignment';
import type { AssignmentFormData } from '@/lib/schemas/forms';
import type { AssignmentResponse } from '@/lib/actions/assignment';
import { useSchedule } from '@/lib/hooks/useSchedule';
import { useScheduleAssignments } from '@/lib/hooks/useScheduleAssignments';
import { useEmployees } from '@/lib/hooks/useEmployees';
import { useShifts } from '@/lib/hooks/useShifts';

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

  const handleSubmit = async (formData: AssignmentFormData) => {
    try {
      const result = await createAssignment({
        ...formData,
        schedule_id: params.id
      });
      
      if (!result.data || result.error) {
        toast.error(result.error || 'Failed to create assignment');
        return;
      }

      toast.success('Assignment created successfully');
      router.push(`/dashboard/schedules/${params.id}`);
    } catch (error) {
      toast.error('Failed to create assignment');
      console.error('Error creating assignment:', error);
    }
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