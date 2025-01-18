/**
 * Offline Page
 * Last Updated: 2025-03-19
 * 
 * Page displayed when the application is offline.
 */

'use client'

import { Button } from '@/app/components/ui/button/index'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re Offline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            Please check your internet connection and try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 