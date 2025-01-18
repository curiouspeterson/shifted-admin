/**
 * Add Employee Button Component
 * Last Updated: 2025-03-19
 * 
 * Button component for adding new employees.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button/index'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

const employeeFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Phone number must be at least 10 characters.',
  }),
  position: z.string().min(2, {
    message: 'Position must be at least 2 characters.',
  }),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export default function AddEmployeeButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
    },
  })

  async function onSubmit(data: EmployeeFormValues) {
    try {
      setIsLoading(true)
      const employeeData: Database['public']['Tables']['employees']['Insert'] = {
        ...data,
        is_active: true,
      }

      const { error } = await supabase.from('employees').insert([employeeData])

      if (error) throw error

      form.reset()
      router.refresh()
    } catch (error) {
      console.error('Error adding employee:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
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
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" type="email" {...field} />
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
                    <Input placeholder="+1234567890" type="tel" {...field} />
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
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Employee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 