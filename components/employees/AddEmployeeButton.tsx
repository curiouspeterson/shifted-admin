'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { ClientButton } from '@/components/ui'

export function AddEmployeeButton(): React.ReactElement {
  const router = useRouter()

  return (
    <ClientButton onClick={() => router.push('/employees/new' as Route)}>
      Add Employee
    </ClientButton>
  )
} 