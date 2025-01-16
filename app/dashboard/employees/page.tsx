/**
 * Employees Page
 * Last Updated: 2024-01-15
 * 
 * Displays a list of employees and allows for employee management.
 */

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmployeeForm from '@/components/employee/EmployeeForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function EmployeesPage() {
  const [open, setOpen] = useState(false)
  const { data, error, isLoading, mutate } = useSWR('/api/employees')

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create employee')
      }

      await mutate()
      setOpen(false)
    } catch (error) {
      console.error('Error creating employee:', error)
      throw error
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error.message || 'Failed to load employees'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setOpen(true)}>
          Add Employee
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add employee list here */}
    </div>
  )
} 