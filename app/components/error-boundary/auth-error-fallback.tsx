/**
 * Auth Error Fallback Component
 * Last Updated: 2025-03-19
 * 
 * Displays a user-friendly error message when authentication fails.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import type { FallbackProps } from 'react-error-boundary'

export function AuthErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {error.message || 'An error occurred during authentication.'}
        </p>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 