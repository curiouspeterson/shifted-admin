/**
 * Sign In Page
 * Last Updated: 2025-01-17
 * 
 * Server component that renders the sign-in page.
 * Uses modern React patterns and Next.js App Router best practices.
 */

import { SignInForm } from '@/components/client/auth/sign-in-form'
import { AuthErrorFallback } from '@/components/client/auth/error-fallback'
import { ErrorBoundary } from 'react-error-boundary'

export default function SignInPage() {
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <ErrorBoundary FallbackComponent={AuthErrorFallback}>
        <SignInForm />
      </ErrorBoundary>
    </div>
  )
} 