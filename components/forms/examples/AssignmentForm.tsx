'use client';

/**
 * Assignment Form Component
 * Last Updated: 2024-03
 * 
 * A form component for creating and editing shift assignments.
 * Features:
 * - Employee selection
 * - Shift selection with supervisor requirements
 * - Date selection
 * - Overlap detection
 * - Supervisor shift toggle
 * - Form validation
 * - Error handling
 */

import * as React from 'react';
import { z } from 'zod';
import { useForm } from '@/app/hooks/form';
import {
  FormWrapper,
  FormInput,
  FormSelect,
  FormDatePicker,
} from '../base';
import { Button } from '@/components/ui/button';
import type { Employee, Shift } from '@/app/lib/types/scheduling';
import { doesTimeOverlap } from '@/app/lib/utils/schedule';

/**
 * Assignment Form Schema
 */
const assignmentFormSchema = z.object({
  schedule_id: z.string(),
  employee_id: z.string({
    required_error: 'Employee is required',
  }),
  shift_id: z.string({
    required_error: 'Shift is required',
  }),
  date: z.date({
    required_error: 'Date is required',
  }),
  is_supervisor_shift: z.boolean().default(false),
  overtime_status: z.enum(['none', 'approved', 'pending']).default('none'),
  overtime_hours: z.number().nullable().default(null),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

/**
 * Assignment Form Props Interface
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
 */
export function AssignmentForm({
  scheduleId,
  employees,
  shifts,
  existingAssignments,
  onSubmit,
  defaultValues,
}: AssignmentFormProps) {
  const {
    form,
    isLoading,
    error,
    handleSubmit,
    reset,
  } = useForm<typeof assignmentFormSchema>({
    schema: assignmentFormSchema,
    defaultValues: {
      schedule_id: scheduleId,
      is_supervisor_shift: false,
      overtime_status: 'none',
      overtime_hours: null,
      ...defaultValues,
    },
    onSubmit,
    onSuccess: () => {
      reset();
    },
  });

  // Watch form fields for validation
  const selectedEmployeeId = form.watch('employee_id');
  const selectedShiftId = form.watch('shift_id');
  const selectedDate = form.watch('date');

  // Validate overlapping shifts
  React.useEffect(() => {
    if (selectedEmployeeId && selectedShiftId && selectedDate) {
      const selectedShift = shifts.find(s => s.id === selectedShiftId);
      if (!selectedShift) return;

      const hasOverlap = existingAssignments.some(assignment => {
        if (assignment.employee_id !== selectedEmployeeId || assignment.date !== selectedDate.toISOString().split('T')[0]) {
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
        form.setError('shift_id', {
          type: 'manual',
          message: 'This shift overlaps with an existing assignment'
        });
      }
    }
  }, [selectedEmployeeId, selectedShiftId, selectedDate, shifts, existingAssignments, form]);

  // Filter employees for selection
  const activeEmployees = employees.filter(e => e.is_active);
  const employeeOptions = activeEmployees.map(employee => ({
    label: `${employee.first_name} ${employee.last_name} (${employee.position})`,
    value: employee.id,
  }));

  // Create shift options
  const shiftOptions = shifts.map(shift => ({
    label: `${shift.name} (${shift.start_time}-${shift.end_time})${shift.requires_supervisor ? ' (Supervisor Required)' : ''}`,
    value: shift.id,
  }));

  return (
    <FormWrapper
      isLoading={isLoading}
      error={error}
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
    >
      {/* Hidden Schedule ID Field */}
      <FormInput
        type="hidden"
        name="schedule_id"
      />

      {/* Date Selection */}
      <FormDatePicker
        name="date"
        label="Date"
        description="Select the assignment date"
      />

      {/* Employee Selection */}
      <FormSelect
        name="employee_id"
        label="Employee"
        description="Select an employee for the assignment"
        options={employeeOptions}
        placeholder="Select an employee"
      />

      {/* Shift Selection */}
      <FormSelect
        name="shift_id"
        label="Shift"
        description="Select a shift to assign"
        options={shiftOptions}
        placeholder="Select a shift"
      />

      {/* Supervisor Shift Toggle */}
      <FormInput
        type="checkbox"
        name="is_supervisor_shift"
        label="Supervisor Shift"
      />

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Add Assignment'}
        </Button>
      </div>
    </FormWrapper>
  );
} 