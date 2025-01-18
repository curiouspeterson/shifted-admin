/**
 * Edit Employee Form Component
 * Last Updated: 2024-01-16
 * 
 * Client-side form component for editing employee details
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/app/components/ui/button/index"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { createClient } from '@/app/lib/supabase/client-side'

const employeeFormSchema = z.object({
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  position: z.string().min(2, {
    message: "Position must be at least 2 characters.",
  }),
  is_active: z.boolean(),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

interface EditEmployeeFormProps {
  employee: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    position: string
    is_active: boolean
  }
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || "",
      position: employee.position,
      is_active: employee.is_active,
    },
  })

  async function onSubmit(data: EmployeeFormValues) {
    try {
      setIsLoading(true)
      const supabase = createClientComponentClient()
      const { error } = await supabase
        .from("employees")
        .update(data)
        .eq("id", employee.id)
      
      if (error) throw error
      
      toast.success("Employee updated successfully")
      router.refresh()
      router.push("/dashboard/employees")
    } catch (error) {
      console.error("Error updating employee:", error)
      toast.error("Failed to update employee. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-medium">First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" className="text-black" {...field} />
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
              <FormLabel className="text-black font-medium">Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" className="text-black" {...field} />
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
              <FormLabel className="text-black font-medium">Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" className="text-black" {...field} />
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
              <FormLabel className="text-black font-medium">Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" className="text-black" {...field} />
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
              <FormLabel className="text-black font-medium">Position</FormLabel>
              <FormControl>
                <Input placeholder="Software Engineer" className="text-black" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-medium">Status</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "true")}
                defaultValue={field.value ? "true" : "false"}
              >
                <FormControl>
                  <SelectTrigger className="text-black">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/employees")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 