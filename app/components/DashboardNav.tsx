/**
 * Dashboard Navigation Component
 * Last Updated: 2024-03-20
 * 
 * A responsive navigation bar component for the dashboard.
 * Features:
 * - Responsive design
 * - Sign-out functionality
 * - Theme toggle
 * - User info display
 */

'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/app-context'
import { createBrowserClient } from '@supabase/ssr'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Schedule', href: '/dashboard/schedule' },
  { name: 'Shifts', href: '/dashboard/shifts' },
  { name: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardNav() {
  const router = useRouter()
  const { theme, toggleTheme, handleError } = useApp()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/sign-in')
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and Navigation Links */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              {/* Add your logo here */}
              <span className="text-xl font-bold text-indigo-600">Shifted</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 