/**
 * Sign In Components
 * Last Updated: 2025-03-19
 * 
 * Client components for the sign-in page.
 */

'use client'

import * as React from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/app/components/client-wrappers/button-client'

export function SignInButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </Button>
  )
}

export function SignInWithGoogleButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="w-full"
    >
      {pending ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  )
}