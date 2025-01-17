/**
 * Employee Form Component
 * Last Updated: 2025-01-17
 * 
 * Form for creating new employee records with validation and error handling.
 * Features:
 * - Type-safe form handling with react-hook-form
 * - Zod schema validation
 * - Shadcn UI components
 * - Loading state management
 * - Error feedback with toast notifications
 * - Success/failure callbacks
 */

'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

interface EmployeeFormProps {
  onSave: () => void;
  onCancel: () => void;
}

// Employee form schema with validation
const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  position: z.enum(['employee', 'shift_supervisor', 'management'], {
    required_error: 'Please select a position',
  }),
  hourly_rate: z.string().min(1, 'Hourly rate is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid hourly rate format'),
  start_date: z.string().min(1, 'Start date is required'),
  phone: z.string().min(1, 'Phone number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeForm({ onSave, onCancel }: EmployeeFormProps) {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      position: 'employee',
      hourly_rate: '',
      start_date: '',
      phone: ''
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to create employee',
          'API_ERROR',
          response.status,
          { data: errorData }
        );
      }

      toast.success('Employee created successfully');
      onSave();
    } catch (error) {
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="shift_supervisor">Shift Supervisor</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="sm:col-start-2"
          >
            {form.formState.isSubmitting ? 'Creating...' : 'Create Employee'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="sm:col-start-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
} 