/**
 * Sign In Page
 * Last Updated: 2025-03-19
 * 
 * Renders the sign-in form with error boundary protection.
 */

import { SignInForm } from '@/app/components/client/auth/sign-in-form'
import { AuthErrorFallback } from '@/app/components/client/auth/error-fallback'
import { ErrorBoundary } from 'react-error-boundary'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and password to access your account
          </p>
        </div>

        <ErrorBoundary FallbackComponent={AuthErrorFallback}>
          <SignInForm />
        </ErrorBoundary>
      </div>
    </div>
  )
} 