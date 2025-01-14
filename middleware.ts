import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/app/lib/supabase/database.types';
import { createMiddlewareCookieHandler } from '@/app/lib/supabase/cookies';
import { handleError } from '@/app/lib/errors';

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  try {
    // Create supabase client with cookie handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: createMiddlewareCookieHandler(request, res)
      }
    );

    // Check auth status
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    // Define protected and auth routes
    const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in') || 
                       request.nextUrl.pathname.startsWith('/sign-up');
    const isProtectedRoute = !isAuthRoute && 
                           !request.nextUrl.pathname.startsWith('/api') &&
                           !request.nextUrl.pathname.startsWith('/_next') &&
                           !request.nextUrl.pathname.startsWith('/public') &&
                           request.nextUrl.pathname !== '/';

    // Handle auth redirects
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // For middleware, we want to continue the request even if there's an error
    // The actual route handlers will handle auth properly
    return res;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 