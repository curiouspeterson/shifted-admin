/**
 * Root Layout Component
 * Last Updated: 2025-03-19
 * 
 * Provides the root layout structure and global providers.
 */

import { AuthProvider } from '@/app/providers/auth-provider'
import './globals.css'

export const metadata = {
  title: 'Shifted Admin',
  description: 'Admin dashboard for managing employee schedules',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
