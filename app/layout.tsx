/**
 * Root Layout
 * Last Updated: 2025-01-17
 * 
 * The root layout component that wraps all pages.
 * Includes global providers and styles.
 */

import { AuthProvider } from '@/providers/auth-provider'
import './globals.css'

export const metadata = {
  title: 'Shifted Admin',
  description: 'Modern admin dashboard built with Next.js',
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
