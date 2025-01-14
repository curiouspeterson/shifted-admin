import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware executing for path:', request.nextUrl.pathname)
  
  const requestHeaders = new Headers(request.headers)
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.delete(name)
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  // Log auth state
  if (error) {
    console.error('❌ Error checking session:', error)
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirect if on auth page with valid session
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 