import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignInForm } from './components'

async function getSession() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; redirectedFrom?: string }
}) {
  const session = await getSession()
  if (session) {
    redirect(searchParams?.redirectedFrom || '/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {searchParams?.message && (
            <div className="mt-2 text-center text-sm text-blue-600">
              {searchParams.message}
            </div>
          )}
          {searchParams?.error && (
            <div className="mt-2 text-center text-sm text-red-600">
              {searchParams.error}
            </div>
          )}
        </div>
        <SignInForm redirectedFrom={searchParams?.redirectedFrom} />
      </div>
    </div>
  )
} 