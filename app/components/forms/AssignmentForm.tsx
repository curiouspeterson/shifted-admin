/**
 * Assignment Form Component
 * Last Updated: 2024
 * 
 * A form component for creating and editing shift assignments. Handles the
 * assignment of employees to shifts with validation for overlapping shifts,
 * supervisor requirements, and scheduling constraints. Uses react-hook-form
 * for form management and zod for schema validation.
 * 
 * Features:
 * - Employee selection
 * - Shift selection with supervisor requirements
 * - Date selection
 * - Overlap detection
 * - Supervisor shift toggle
 * - Form validation
 * - Error handling
 */

'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { AssignmentFormData } from '@/app/lib/schemas/forms';
import { assignmentFormSchema } from '@/app/lib/schemas/forms';
import type { Employee, Shift } from '@/app/lib/types/scheduling';
import { doesTimeOverlap } from '@/app/lib/utils/schedule';

/**
 * Assignment Form Props Interface
 * @property scheduleId - ID of the schedule being modified
 * @property employees - List of available employees
 * @property shifts - List of available shifts
 * @property existingAssignments - Current assignments to check for conflicts
 * @property onSubmit - Callback for form submission
 * @property defaultValues - Optional initial form values
 */
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

/**
 * Assignment Form Component
 * Form for creating and editing shift assignments
 * 
 * @param props - Component properties
 * @param props.scheduleId - Schedule being modified
 * @param props.employees - Available employees
 * @param props.shifts - Available shifts
 * @param props.existingAssignments - Current assignments
 * @param props.onSubmit - Success callback
 * @param props.defaultValues - Initial values
 * @returns A form for shift assignment creation/editing
 */
export function AssignmentForm({
  scheduleId,
  employees,
  shifts,
  existingAssignments,
  onSubmit,
  defaultValues
}: AssignmentFormProps) {
  // Form management with react-hook-form
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

  // Watch form fields for validation
  const selectedEmployeeId = watch('employee_id');
  const selectedShiftId = watch('shift_id');
  const selectedDate = watch('date');

  /**
   * Validate Overlapping Shifts
   * Checks if the selected shift overlaps with any existing assignments
   * for the selected employee on the selected date
   */
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

  /**
   * Form Submission Handler
   * Processes the form submission and resets form on success
   * @param data - Form data to submit
   */
  const onSubmitForm = async (data: AssignmentFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    }
  };

  // Filter employees for selection
  const activeEmployees = employees.filter(e => e.is_active);
  const supervisors = activeEmployees.filter(e => e.position === 'supervisor');

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Hidden Schedule ID Field */}
      <input type="hidden" {...register('schedule_id')} />

      {/* Date Selection */}
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

      {/* Employee Selection */}
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

      {/* Shift Selection */}
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

      {/* Supervisor Shift Toggle */}
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

      {/* Form Actions */}
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