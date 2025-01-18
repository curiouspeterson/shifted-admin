/**
 * Employee List Component
 * Last Updated: 2025-03-19
 * 
 * Displays a list of employees with their details and actions.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import type { Route } from 'next'
import type { Employee } from '@/app/lib/types/employees'

interface EmployeeListProps {
  employees: Employee[]
}

export default function EmployeeList({ employees }: EmployeeListProps) {
  return (
    <div className="space-y-4">
      {employees.map((employee) => (
        <Card key={employee.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {employee.first_name} {employee.last_name}
              </CardTitle>
              <Badge variant={getRoleBadgeVariant(employee.role)}>
                {employee.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{employee.email}</p>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href={`/employees/${employee.id}` as Route}>View Details</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/employees/${employee.id}/edit` as Route}>Edit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getRoleBadgeVariant(role: string) {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'destructive'
    case 'supervisor':
      return 'secondary'
    default:
      return 'default'
  }
} 