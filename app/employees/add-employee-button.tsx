/**
 * Add Employee Button Component
 * Last Updated: 2025-03-19
 * 
 * A button that opens a dialog for adding a new employee.
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Define Database types
type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          position: string
          department: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
    }
  }
}

const employeeFormSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  is_active: z.boolean().default(true),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export function AddEmployeeButton() {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      is_active: true,
    },
  })

  async function onSubmit(values: EmployeeFormValues) {
    try {
      setIsLoading(true)
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error("Authentication error: " + userError.message)
      }
      
      if (!user) {
        throw new Error("No authenticated user. Please log in again.")
      }

      // Prepare employee data with explicit null handling for phone
      const employeeData = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone: typeof values.phone === 'string' && values.phone.trim() !== '' ? values.phone.trim() : null,
        position: values.position.trim(),
        department: values.department.trim(),
        is_active: values.is_active,
        created_by: user.id,
        updated_by: user.id
      } satisfies Database['public']['Tables']['employees']['Insert']

      const { error: insertError } = await supabase
        .from('employees')
        .insert(employeeData)
      
      if (insertError) {
        if (insertError.code === "42501") {
          throw new Error("Permission denied. Please check your access rights.")
        }
        if (insertError.message.includes("duplicate key")) {
          throw new Error("An employee with this email already exists.")
        }
        throw new Error(insertError.message)
      }

      toast.success("Employee added successfully")
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error adding employee:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add employee. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Add Employee</DialogTitle>
          <DialogDescription className="text-gray-500">
            Add a new employee to your organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-medium">First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-medium">Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Doe" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-medium">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="john.doe@example.com" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-medium">Phone</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="+1234567890" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field}
                      value={field.value ?? ''} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-medium">Position</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Software Engineer" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-medium">Department</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Engineering" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              isLoading={isLoading}
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              {isLoading ? "Adding..." : "Submit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 