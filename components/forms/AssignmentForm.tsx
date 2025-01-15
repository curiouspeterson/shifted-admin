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
import { useEffect } from 'react';
import type { AssignmentFormData, Employee, Shift } from '@/lib/schemas';
import { assignmentFormSchema } from '@/lib/schemas';
import { doesTimeOverlap } from '@/lib/utils/schedule';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Checkbox,
  Input,
  Button,
} from '@/components/ui';
import { BaseForm, SelectField, DateField } from '../forms/base';

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
  defaultValues,
}: AssignmentFormProps) {
  // Convert employees and shifts to options format
  const employeeOptions = employees
    .filter(e => e.is_active)
    .map(employee => ({
      value: employee.id,
      label: `${employee.first_name} ${employee.last_name} (${employee.position})`
    }));

  const shiftOptions = shifts.map(shift => ({
    value: shift.id,
    label: `${shift.name} (${shift.start_time}-${shift.end_time})${shift.requires_supervisor ? ' (Supervisor Required)' : ''}`
  }));

  return (
    <BaseForm
      schema={assignmentFormSchema}
      onSubmit={onSubmit}
      defaultValues={{
        schedule_id: scheduleId,
        employee_id: defaultValues?.employee_id ?? '',
        shift_id: defaultValues?.shift_id ?? '',
        date: defaultValues?.date ?? '',
        is_supervisor_shift: false,
        overtime_status: 'none',
        overtime_hours: null,
        ...defaultValues,
      }}
      className="space-y-6"
    >
      {(form) => {
        // Watch form fields for validation
        const selectedEmployeeId = form.watch('employee_id');
        const selectedShiftId = form.watch('shift_id');
        const selectedDate = form.watch('date');

        // Validate overlapping shifts
        useEffect(() => {
          if (selectedEmployeeId && selectedShiftId && selectedDate) {
            const selectedShift = shifts.find(s => s.id === selectedShiftId);
            if (!selectedShift) return;

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
              form.setError('shift_id', {
                type: 'manual',
                message: 'This shift overlaps with an existing assignment'
              });
            }
          }
        }, [selectedEmployeeId, selectedShiftId, selectedDate, shifts, existingAssignments, form]);

        return (
          <>
            {/* Hidden Schedule ID Field */}
            <input type="hidden" {...form.register('schedule_id')} />

            {/* Date Selection */}
            <DateField
              form={form}
              name="date"
              label="Date"
            />

            {/* Employee Selection */}
            <SelectField
              form={form}
              name="employee_id"
              label="Employee"
              options={employeeOptions}
              placeholder="Select an employee"
            />

            {/* Shift Selection */}
            <SelectField
              form={form}
              name="shift_id"
              label="Shift"
              options={shiftOptions}
              placeholder="Select a shift"
            />

            {/* Supervisor Shift Toggle */}
            <FormField
              control={form.control}
              name="is_supervisor_shift"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Supervisor Shift</FormLabel>
                    <FormDescription>
                      Mark this as a supervisor shift
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Add Assignment'}
              </Button>
            </div>
          </>
        );
      }}
    </BaseForm>
  );
} 