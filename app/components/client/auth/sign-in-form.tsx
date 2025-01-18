/**
 * Sign In Form Component
 * Last Updated: 2025-03-19
 * 
 * A simplified sign-in form with basic validation and error handling.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from '@/app/actions/auth'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button/index'

export function SignInForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await signIn(formData)

      if (result.success === false) {
        setError(result.error ?? 'Sign in failed')
        return
      }

      // Redirect on success
      router.push('/dashboard')
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error !== null && error.length > 0 && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          aria-label="Email"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          aria-label="Password"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        Sign In
      </Button>
    </form>
  )
} 