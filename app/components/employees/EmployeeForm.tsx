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
import { 
  type Employee,
  type CreateEmployeeFormData,
  type UpdateEmployeeFormData,
  createEmployeeFormSchema,
  updateEmployeeFormSchema,
  createEmployeeInputFromForm,
  updateEmployeeInputFromForm,
  employeeRoles,
  employeeStatuses
} from '@/lib/types/employee'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmployeeFormProps {
  employee?: Employee
  onSuccess?: () => void
  onCancel?: () => void
}

export function EmployeeForm({ employee, onSuccess, onCancel }: EmployeeFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!employee

  // Initialize form with either create or update schema
  const form = useForm<CreateEmployeeFormData | UpdateEmployeeFormData>({
    resolver: zodResolver(isEditing ? updateEmployeeFormSchema : createEmployeeFormSchema),
    defaultValues: employee ? {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
      status: employee.status,
      department: employee.department || '',
      position: employee.position || ''
    } : {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'employee' as const,
      status: 'active' as const,
      department: '',
      position: ''
    }
  })

  // Handle form submission
  const onSubmit = async (formData: CreateEmployeeFormData | UpdateEmployeeFormData) => {
    startTransition(async () => {
      try {
        // Transform form data to database input and submit
        const result = isEditing 
          ? await updateEmployee(updateEmployeeInputFromForm(formData as UpdateEmployeeFormData))
          : await createEmployee(createEmployeeInputFromForm(formData as CreateEmployeeFormData))

        if (result.error) {
          toast.error(result.error)
          return
        }

        if (!result.data) {
          toast.error('No data returned from server')
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employeeRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employeeStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    value={field.value || ''} 
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
                    value={field.value || ''} 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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