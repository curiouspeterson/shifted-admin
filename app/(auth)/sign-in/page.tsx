/**
 * Sign In Page
 * Last Updated: 2025-03-19
 * 
 * Server Component for the sign-in page.
 */

import { ErrorBoundary } from 'react-error-boundary'
import { AuthErrorFallback } from '@/app/components/error-boundary/auth-error-fallback'
import { SignInButton, SignInWithGoogleButton } from './components'
import { signIn, signInWithGoogle } from '../actions'

export default function SignInPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Shifted Admin
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground">Enter your email below to sign in to your account</p>
          </div>
          <ErrorBoundary FallbackComponent={AuthErrorFallback}>
            <div className="space-y-4">
              <form action={signIn}>
                <SignInButton />
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <form action={signInWithGoogle}>
                <SignInWithGoogleButton />
              </form>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
} 