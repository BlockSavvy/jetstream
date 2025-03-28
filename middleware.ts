import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Pages that should be protected by authentication
const PROTECTED_ROUTES = [
  '/jetshare/dashboard',
  '/jetshare/offer',
  '/jetshare/listings/manage',
  '/jetshare/payment',
];

// Public pages in the JetShare section
const PUBLIC_JETSHARE_ROUTES = [
  '/jetshare',
  '/jetshare/listings',
];

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // Create a response object
    const res = NextResponse.next();

    // Define route categories
    const isAuthRoute = pathname.startsWith('/auth');
    const isAuthCallback = pathname === '/auth/callback';
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isPublicJetShareRoute = PUBLIC_JETSHARE_ROUTES.some(route => 
      pathname === route || 
      (route === '/jetshare/listings' && pathname.startsWith('/jetshare/listings') && !pathname.includes('manage'))
    );
    
    // Skip auth check for callback routes
    if (isAuthCallback) {
      return res;
    }

    // If it's a public JetShare route, no need to check auth
    if (isPublicJetShareRoute) {
      console.log(`Public JetShare route ${pathname}, allowing access`);
      return res;
    }

    // For protected routes, check auth using cookies directly without parsing
    if (isProtectedRoute) {
      // Simple cookie check for auth - doesn't parse the cookie, just checks if it exists
      const hasAuthCookie = request.cookies.has('sb-access-token') || 
                            request.cookies.has('sb-refresh-token') || 
                            request.headers.get('cookie')?.includes('sb-');
      
      console.log(`Auth check for ${pathname}: HasAuthCookie=${!!hasAuthCookie}`);
      
      if (!hasAuthCookie) {
        console.log(`Redirecting unauthenticated user from ${pathname} to login`);
        const returnUrl = encodeURIComponent(request.url);
        return NextResponse.redirect(new URL(`/auth/login?returnUrl=${returnUrl}`, request.url));
      }
    }

    // Handle auth routes without parsing cookies
    if (isAuthRoute && !isAuthCallback) {
      const hasAuthCookie = request.cookies.has('sb-access-token') || 
                            request.cookies.has('sb-refresh-token') || 
                            request.headers.get('cookie')?.includes('sb-');
      
      if (hasAuthCookie) {
        // User has auth cookies and is trying to access auth routes
        const returnUrl = request.nextUrl.searchParams.get('returnUrl');
        
        if (returnUrl) {
          try {
            const url = new URL(decodeURIComponent(returnUrl));
            const isSameOrigin = url.origin === request.nextUrl.origin;
            
            if (isSameOrigin) {
              console.log(`Redirecting authenticated user to returnUrl: ${returnUrl}`);
              return NextResponse.redirect(url);
            }
          } catch (e) {
            console.log(`Invalid returnUrl, redirecting to home`);
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
        
        console.log(`Auth route with no returnUrl, redirecting to home`);
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, continue without redirecting
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - api routes (except auth-related ones)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api(?!/auth)).*)',
  ],
}; 