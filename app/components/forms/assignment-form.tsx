/**
 * Assignment Form Component
 * Last Updated: 2024-01-16
 * 
 * A form component for creating and editing schedule assignments.
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentFormSchema } from '@/lib/schemas/forms';
import type { AssignmentFormData } from '@/lib/schemas/forms';
import { FormField, FormLabel, FormMessage } from './base/FormField';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from './base/DatePicker';
import type { Employee } from '@/lib/types/employee';
import type { Shift } from '@/lib/types/shift';

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
}

export function AssignmentForm({
  scheduleId,
  employees,
  shifts,
  existingAssignments,
  onSubmit
}: AssignmentFormProps) {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      schedule_id: scheduleId,
      employee_id: '',
      shift_id: '',
      date: '',
      is_supervisor_shift: false,
      overtime_hours: null,
      overtime_status: null,
      created_by: null,
      updated_by: null,
      version: 1
    }
  });

  const handleSubmit = async (data: AssignmentFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FormField name="employee_id">
        <FormLabel>Employee</FormLabel>
        <Select
          onValueChange={(value) => form.setValue('employee_id', value)}
          value={form.watch('employee_id')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormField>

      <FormField name="shift_id">
        <FormLabel>Shift</FormLabel>
        <Select
          onValueChange={(value) => form.setValue('shift_id', value)}
          value={form.watch('shift_id')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((shift) => (
              <SelectItem key={shift.id} value={shift.id}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormField>

      <FormField name="date">
        <FormLabel>Date</FormLabel>
        <DatePicker
          selected={form.getValues('date') ? new Date(form.getValues('date')) : null}
          onSelect={(date: Date | null) => form.setValue('date', date ? date.toISOString().split('T')[0] : '')}
        />
        <FormMessage />
      </FormField>

      <FormField name="is_supervisor_shift">
        <FormLabel>Supervisor Shift</FormLabel>
        <input
          type="checkbox"
          {...form.register('is_supervisor_shift')}
        />
        <FormMessage />
      </FormField>

      <Button type="submit">Create Assignment</Button>
    </form>
  );
} 