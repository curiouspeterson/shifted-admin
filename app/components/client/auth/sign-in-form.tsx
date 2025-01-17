/**
 * Sign In Form Component
 * Last Updated: 2025-03-19
 *
 * A dedicated client-side form component for handling authentication.
 * Follows 2025 best practices for React component organization.
 */

'use client'

import * as React from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/client-wrappers/input-client'
import { loginRequestSchema } from '@/lib/validations/auth'

export function SignInForm() {
  const { signIn, isLoading, error: authError } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const validateForm = React.useCallback(() => {
    try {
      loginRequestSchema.parse({ email, password })
      setValidationError(null)
      return true
    } catch (err) {
      if (err instanceof Error) {
        setValidationError(err.message)
      } else {
        setValidationError('Invalid form data')
      }
      return false
    }
  }, [email, password])

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!validateForm()) {
      return
    }

    try {
      await signIn(email, password)
    } catch (err) {
      console.error('Sign in failed:', err)
      // Error will be handled by error boundary
      throw err
    }
  }, [email, password, signIn, validateForm])

  const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setValidationError(null)
  }, [])

  const handlePasswordChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setValidationError(null)
  }, [])

  const hasValidationError = Boolean(validationError)
  const errorMessage = validationError || (authError?.message ?? '')
  const showError = errorMessage.length > 0

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <Input
            type="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
            value={email}
            onChange={handleEmailChange}
            aria-invalid={hasValidationError}
            aria-describedby={hasValidationError ? 'form-error' : undefined}
          />
        </div>
        <div>
          <Input
            type="password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            aria-invalid={hasValidationError}
            aria-describedby={hasValidationError ? 'form-error' : undefined}
          />
        </div>
      </div>

      {showError && (
        <div id="form-error" className="text-red-500 text-sm" role="alert">
          {errorMessage}
        </div>
      )}

      <div>
        <Button
          type="submit"
          disabled={isLoading || !email || !password}
          isLoading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>
      </div>
    </form>
  )
} 