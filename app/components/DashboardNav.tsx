/**
 * Dashboard Navigation Component
 * Last Updated: 2024
 * 
 * A responsive navigation bar component for the dashboard that adapts its
 * menu items based on the user's role (manager vs employee). Provides
 * navigation links to different sections of the application and handles
 * user sign-out functionality.
 * 
 * Features:
 * - Role-based navigation items
 * - Responsive design
 * - Sign-out functionality
 * - User info display
 * - Consistent styling with app theme
 */

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Employee Interface
 * Defines the structure of employee data needed for navigation
 * 
 * @property id - Unique identifier for the employee
 * @property first_name - Employee's first name
 * @property last_name - Employee's last name
 * @property position - Employee's role/position (determines available navigation options)
 */
interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
}

/**
 * Dashboard Navigation Props
 * @property employee - Employee data for customizing navigation and display
 */
interface DashboardNavProps {
  employee: Employee
}

/**
 * Dashboard Navigation Component
 * Main navigation bar for the dashboard interface
 * 
 * @param props - Component properties
 * @param props.employee - Current employee's data
 * @returns A responsive navigation bar with role-based menu items
 */
export default function DashboardNav({ employee }: DashboardNavProps) {
  const router = useRouter()

  /**
   * Handles user sign-out process
   * - Calls sign-out API endpoint
   * - Redirects to sign-in page on success
   * - Handles errors appropriately
   */
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

  // Determine if user has manager-level access
  const isManager = ['shift_supervisor', 'management'].includes(employee.position)

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo and Navigation Links */}
          <div className="flex">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                Shifted
              </Link>
            </div>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Overview - Available to all users */}
              <Link
                href="/dashboard"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Overview
              </Link>

              {/* Manager-only navigation items */}
              {isManager && (
                <Link
                  href="/dashboard/schedules"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Schedules
                </Link>
              )}

              {/* Shifts - Available to all users */}
              <Link
                href="/dashboard/shifts"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Shifts
              </Link>

              {/* Manager-only employee management */}
              {isManager && (
                <Link
                  href="/dashboard/employees"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Employees
                </Link>
              )}

              {/* Requests - Available to all users */}
              <Link
                href="/dashboard/requests"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Requests
              </Link>

              {/* Availability - Available to all users */}
              <Link
                href="/dashboard/availability"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Availability
              </Link>
            </div>
          </div>

          {/* Right side: User Info and Sign Out */}
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