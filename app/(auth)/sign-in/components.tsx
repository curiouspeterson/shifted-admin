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

import { useFormStatus } from 'react-dom'
import { signIn } from '../actions'

/**
 * Sign In Button Component
 * Renders a submit button with loading state
 * Shows a spinner when form is submitting
 * 
 * @returns A styled button with loading indicator
 */
export function SignInButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
      ) : (
        'Sign in'
      )}
    </button>
  )
}

/**
 * Sign In Form Component
 * Renders a complete sign-in form with email and password fields
 * Handles form submission through server actions
 * 
 * @param props.redirectedFrom - Optional URL to redirect to after successful sign-in
 * @returns A styled form with email/password inputs and submit button
 */
export function SignInForm({ redirectedFrom }: { redirectedFrom?: string }) {
  return (
    <form className="mt-8 space-y-6" action={signIn}>
      {/* Hidden redirect field */}
      {redirectedFrom && (
        <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
      )}
      
      {/* Input Fields Container */}
      <div className="rounded-md shadow-sm -space-y-px">
        {/* Email Input */}
        <div>
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        
        {/* Password Input */}
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
            minLength={6}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <SignInButton />
      </div>
    </form>
  )
} 