/**
 * Not Found Page Component
 * Last Updated: 2025-03-19
 * 
 * Displays a 404 error page with a link to return home.
 */

import Link from 'next/link'
import { Button } from '@/app/components/ui/button/index'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl">Page Not Found</h2>
        <p className="mb-8 text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  )
} 