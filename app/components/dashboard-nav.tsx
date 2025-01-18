/**
 * Dashboard Navigation Component
 * Last Updated: 2025-03-19
 * 
 * Main navigation component for the dashboard layout.
 * Uses Next.js App Router patterns for type-safe navigation.
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Users,
  FileText,
  BarChart2,
  Settings,
  LogOut
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const navItems: Array<NavItem> = [
  {
    title: 'Schedules',
    href: '/dashboard/schedules',
    icon: Calendar
  },
  {
    title: 'Time Off',
    href: '/dashboard/time-off-requests',
    icon: Clock
  },
  {
    title: 'Employees',
    href: '/dashboard/employees',
    icon: Users
  },
  {
    title: 'Requirements',
    href: '/dashboard/requirements',
    icon: FileText
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart2
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const href = { pathname: item.href }
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
      <button
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-auto"
        onClick={() => {
          // Handle logout
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </nav>
  )
} 