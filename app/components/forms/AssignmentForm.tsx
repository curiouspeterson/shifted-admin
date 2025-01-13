'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { AssignmentFormData } from '@/app/lib/schemas/forms';
import { assignmentFormSchema } from '@/app/lib/schemas/forms';
import type { Employee, Shift } from '@/app/types/scheduling';
import { doesTimeOverlap } from '@/app/lib/utils/schedule';

interface AssignmentFormProps {
  scheduleId: string;
  employees: Employee[];
  shifts: Shift[];
  existingAssignments: {
    employee_id: string;
    shift_id: string;
    date: string;
  }[];
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  defaultValues?: Partial<AssignmentFormData>;
}

export function AssignmentForm({
  scheduleId,
  employees,
  shifts,
  existingAssignments,
  onSubmit,
  defaultValues
}: AssignmentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      schedule_id: scheduleId,
      is_supervisor_shift: false,
      overtime_status: 'none',
      overtime_hours: null,
      ...defaultValues,
    },
  });

  // Watch for changes to validate overlapping shifts
  const selectedEmployeeId = watch('employee_id');
  const selectedShiftId = watch('shift_id');
  const selectedDate = watch('date');

  // Validate overlapping shifts when selections change
  useEffect(() => {
    if (selectedEmployeeId && selectedShiftId && selectedDate) {
      const selectedShift = shifts.find(s => s.id === selectedShiftId);
      if (!selectedShift) return;

      // Check for overlapping assignments
      const hasOverlap = existingAssignments.some(assignment => {
        if (assignment.employee_id !== selectedEmployeeId || assignment.date !== selectedDate) {
          return false;
        }

        const assignmentShift = shifts.find(s => s.id === assignment.shift_id);
        if (!assignmentShift) return false;

        return doesTimeOverlap(
          selectedShift.start_time,
          selectedShift.end_time,
          assignmentShift.start_time,
          assignmentShift.end_time
        );
      });

      if (hasOverlap) {
        setError('shift_id', {
          type: 'manual',
          message: 'This shift overlaps with an existing assignment'
        });
      }
    }
  }, [selectedEmployeeId, selectedShiftId, selectedDate, shifts, existingAssignments, setError]);

  const onSubmitForm = async (data: AssignmentFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };

  const activeEmployees = employees.filter(e => e.is_active);
  const supervisors = activeEmployees.filter(e => e.position === 'supervisor');

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <input type="hidden" {...register('schedule_id')} />

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          {...register('date')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
          Employee
        </label>
        <select
          id="employee_id"
          {...register('employee_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select an employee</option>
          {activeEmployees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name} ({employee.position})
            </option>
          ))}
        </select>
        {errors.employee_id && (
          <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="shift_id" className="block text-sm font-medium text-gray-700">
          Shift
        </label>
        <select
          id="shift_id"
          {...register('shift_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select a shift</option>
          {shifts.map(shift => (
            <option key={shift.id} value={shift.id}>
              {shift.name} ({shift.start_time}-{shift.end_time})
              {shift.requires_supervisor && ' (Supervisor Required)'}
            </option>
          ))}
        </select>
        {errors.shift_id && (
          <p className="mt-1 text-sm text-red-600">{errors.shift_id.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <Controller
          name="is_supervisor_shift"
          control={control}
          render={({ field: { onChange, value } }) => (
            <input
              type="checkbox"
              id="is_supervisor_shift"
              checked={value}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          )}
        />
        <label htmlFor="is_supervisor_shift" className="ml-2 block text-sm text-gray-700">
          Supervisor Shift
        </label>
        {errors.is_supervisor_shift && (
          <p className="mt-1 text-sm text-red-600">{errors.is_supervisor_shift.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Add Assignment'}
        </button>
      </div>
    </form>
  );
} 