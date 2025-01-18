/**
 * Auth Error Fallback Component
 * Last Updated: 2025-03-19
 * 
 * A client component for displaying authentication errors.
 */

'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface AuthErrorFallbackProps {
  error: Error
  reset: () => void
}

export function AuthErrorFallback({ error, reset }: AuthErrorFallbackProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Authentication Error</CardTitle>
        </div>
        <CardDescription>
          An error occurred while trying to authenticate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {error.message || 'Please try again or contact support if the problem persists.'}
        </p>
        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 