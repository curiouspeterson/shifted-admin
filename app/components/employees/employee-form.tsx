/**
 * Employee Form Component
 * Last Updated: 2024-03-21
 * 
 * Form component for creating and updating employees.
 * Uses Server Actions for form submission and validation.
 */

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createEmployee, updateEmployee } from '@/lib/actions/employee'
import { type Employee } from '@/lib/types/employee'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Form validation schemas
const employeeFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable(),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  is_active: z.boolean().default(true)
})

const updateEmployeeFormSchema = employeeFormSchema.extend({
  id: z.string()
})

type EmployeeFormData = z.infer<typeof employeeFormSchema>
type UpdateEmployeeFormData = z.infer<typeof updateEmployeeFormSchema>

interface EmployeeFormProps {
  employee?: Employee
  onSuccess?: () => void
  onCancel?: () => void
}

export function EmployeeForm({ employee, onSuccess, onCancel }: EmployeeFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!employee

  // Initialize form with either create or update schema
  const form = useForm<EmployeeFormData | UpdateEmployeeFormData>({
    resolver: zodResolver(isEditing ? updateEmployeeFormSchema : employeeFormSchema),
    defaultValues: employee ? {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      is_active: employee.is_active
    } : {
      first_name: '',
      last_name: '',
      email: '',
      phone: null,
      position: '',
      department: '',
      is_active: true
    }
  })

  // Handle form submission
  const onSubmit = async (formData: EmployeeFormData | UpdateEmployeeFormData) => {
    startTransition(async () => {
      try {
        const result = isEditing 
          ? await updateEmployee({
              id: (formData as UpdateEmployeeFormData).id,
              ...formData,
            })
          : await createEmployee(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        if (!result.data) {
          toast.error('Failed to save employee')
          return
        }

        toast.success(
          isEditing 
            ? 'Employee updated successfully' 
            : 'Employee created successfully'
        )
        
        form.reset()
        onSuccess?.()
      } catch (error) {
        toast.error('An unexpected error occurred')
        console.error('Error submitting employee form:', error)
      }
    })
  }

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
                  <Input 
                    placeholder="John" 
                    {...field} 
                    disabled={isPending}
                  />
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
                  <Input 
                    placeholder="Doe" 
                    {...field} 
                    disabled={isPending}
                  />
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
                <Input 
                  type="email"
                  placeholder="john.doe@example.com" 
                  {...field} 
                  disabled={isPending}
                />
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
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input 
                  type="tel"
                  placeholder="+1234567890" 
                  {...field} 
                  value={field.value || ''} 
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Software Engineer" 
                    {...field} 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Engineering" 
                    {...field} 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === 'active')}
                defaultValue={field.value ? 'active' : 'inactive'}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Employee' : 'Create Employee'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 