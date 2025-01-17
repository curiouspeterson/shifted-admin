/**
 * Sign In Form Component
 * Last Updated: 2025-01-17
 * 
 * A dedicated client-side form component for handling authentication.
 * Follows 2025 best practices for React component organization.
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/client-wrappers/button-client'
import { Input } from '@/components/client-wrappers/input-client'

export function SignInForm() {
  const router = useRouter()
  const { signIn, isLoading, error } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      // After successful sign in, redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Sign in failed:', err)
      // Error will be handled by error boundary
      throw err
    }
  }, [email, password, signIn, router])

  const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

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
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error.message}
        </div>
      )}

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </form>
  )
} 