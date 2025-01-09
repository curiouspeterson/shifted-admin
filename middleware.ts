import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for static and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('/api/') ||
    request.nextUrl.pathname.includes('.ico') ||
    request.nextUrl.pathname.includes('favicon')
  ) {
    return NextResponse.next()
  }

  // Create base response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.redirect(new URL('/error', request.url))
    }

    // Create Supabase client with minimal cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Only set essential auth cookies
            if (name === 'sb-access-token' || name === 'sb-refresh-token') {
              response.cookies.set({
                name,
                value,
                ...options,
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: true,
              })
            }
          },
          remove(name: string, options: any) {
            if (name === 'sb-access-token' || name === 'sb-refresh-token') {
              response.cookies.delete(name)
            }
          },
        },
        auth: {
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )

    // Get session with minimal data
    const { data: { session } } = await supabase.auth.getSession()

    // Handle routing based on auth state
    const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') || 
                      request.nextUrl.pathname.startsWith('/sign-up') ||
                      request.nextUrl.pathname.startsWith('/auth/')

    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL(session ? '/dashboard' : '/sign-in', request.url))
    }

    if (!session && !isAuthPage) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    if (session && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 