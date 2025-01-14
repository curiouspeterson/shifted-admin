import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/app/lib/supabase/database.types'
import { createMiddlewareCookieHandler } from '@/app/lib/supabase/cookies'
import { handleAuthError } from '@/app/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'

    if (!code) {
      return NextResponse.redirect(
        new URL('/sign-in?error=No code provided', request.url)
      )
    }

    const response = NextResponse.next()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: createMiddlewareCookieHandler(request, response)
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error

    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('Error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/sign-in?error=Failed to authenticate', request.url)
    )
  }
} 