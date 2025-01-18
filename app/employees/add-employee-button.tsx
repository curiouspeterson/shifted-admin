/**
 * Add Employee Button Component
 * Last Updated: 2025-03-19
 * 
 * A button component for adding new employees.
 */

'use client'

import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import type { Route } from 'next'

export default function AddEmployeeButton() {
  return (
    <Button asChild>
      <Link href={'/employees/new' as Route}>Add Employee</Link>
    </Button>
  )
} 