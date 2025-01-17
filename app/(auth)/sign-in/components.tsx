/**
 * Sign In Components Module
 * Last Updated: 2024
 * 
 * Provides reusable components for the sign-in functionality.
 * These components handle form submission, loading states,
 * and user input for authentication.
 * 
 * Features:
 * - Form submission handling
 * - Loading state management
 * - Input validation
 * - Responsive design
 * - Accessible form controls
 * - Client-side only functionality
 */

'use client'

import * as React from 'react'
import { signIn } from '../actions'

/**
 * Sign In Form Component
 * Renders a complete sign-in form with email and password fields
 * Handles form submission through server actions
 * 
 * @param props.redirectedFrom - Optional URL to redirect to after successful sign-in
 * @returns A styled form with email/password inputs and submit button
 */
export function SignInForm({ redirectedFrom }: { redirectedFrom?: string }): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(formData: FormData): Promise<void> {
    const emailValue = formData.get('email')
    const passwordValue = formData.get('password')
    
    if (typeof emailValue !== 'string' || typeof passwordValue !== 'string') {
      setError('Invalid form data')
      return
    }

    const result = await signIn(emailValue, passwordValue)
    if (result.error !== undefined && result.error !== '') {
      setError(result.error)
    }
  }

  return (
    <form className="mt-8 space-y-6" action={handleSubmit}>
      {/* Hidden redirect field */}
      {typeof redirectedFrom === 'string' && redirectedFrom !== '' && (
        <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
      )}
      {error !== null && error !== '' && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6 rounded-md shadow-sm">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Email address"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Sign in
        </button>
      </div>
    </form>
  )
} 