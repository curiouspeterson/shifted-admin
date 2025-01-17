/**
 * Dashboard Navigation Component
 * Last Updated: 2024-03-21
 * 
 * Main navigation component for the dashboard.
 * Uses app context for online/offline status.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/lib/context/app-context';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Clock,
  FileText,
  Home,
  Users,
  AlertTriangle
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Schedules',
    href: '/dashboard/schedules',
    icon: Calendar
  },
  {
    title: 'Shifts',
    href: '/dashboard/shifts',
    icon: Clock
  },
  {
    title: 'Employees',
    href: '/dashboard/employees',
    icon: Users
  },
  {
    title: 'Requests',
    href: '/dashboard/requests',
    icon: FileText
  },
  {
    title: 'Error Reports',
    href: '/dashboard/error-reports',
    icon: AlertTriangle,
    adminOnly: true
  }
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { state } = useAppContext();
  
  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              isActive ? 'bg-accent' : 'transparent',
              !state.isOnline && 'opacity-50 cursor-not-allowed'
            )}
            onClick={(e) => !state.isOnline && e.preventDefault()}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
} 