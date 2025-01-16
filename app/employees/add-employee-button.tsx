"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { CreateEmployeeInput } from "./types"

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
  }).optional(),
  position: z.string().min(2, {
    message: "Position must be at least 2 characters.",
  }),
  is_active: z.boolean().default(true),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export function AddEmployeeButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      position: "",
      is_active: true,
    },
  })

  async function onSubmit(values: EmployeeFormValues) {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error("Authentication error: " + userError.message)
      }
      
      if (!user) {
        throw new Error("No authenticated user. Please log in again.")
      }

      // Log the data being sent
      const employeeData = {
        name: `${values.first_name} ${values.last_name}`.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || '',
        position: values.position.trim(),
        status: (values.is_active ? 'active' : 'inactive') as 'active' | 'inactive'
      }
      console.log('Sending employee data:', employeeData)

      const { data, error: insertError } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
      
      if (insertError) {
        console.error("Insert error:", insertError)
        if (insertError.code === "42501") {
          throw new Error("Permission denied. Please check your access rights.")
        }
        if (insertError.message.includes("duplicate key")) {
          throw new Error("An employee with this email already exists.")
        }
        throw new Error(insertError.message)
      }

      console.log('Insert response:', data)
      
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
                      placeholder="+1234567890" 
                      className="bg-white text-black border-gray-300 focus:border-gray-400" 
                      {...field}
                      value={field.value || ''} 
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
            <Button 
              type="submit" 
              disabled={isLoading}
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