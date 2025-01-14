'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
}

interface DashboardNavProps {
  employee: Employee
}

export default function DashboardNav({ employee }: DashboardNavProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sign out')
      }

      router.push('/sign-in')
      router.refresh()
    } catch (err) {
      console.error('Error signing out:', err)
      // Handle error appropriately
    }
  }

  const isManager = ['shift_supervisor', 'management'].includes(employee.position)

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                Shifted
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Overview
              </Link>
              {isManager && (
                <Link
                  href="/dashboard/schedules"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Schedules
                </Link>
              )}
              <Link
                href="/dashboard/shifts"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Shifts
              </Link>
              {isManager && (
                <Link
                  href="/dashboard/employees"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Employees
                </Link>
              )}
              <Link
                href="/dashboard/requests"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Requests
              </Link>
              <Link
                href="/dashboard/availability"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Availability
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {employee.first_name} {employee.last_name}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 