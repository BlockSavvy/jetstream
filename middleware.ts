import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/auth/callback',
  '/auth/error',
  '/api/webhooks',
  '/api/auth',
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/sync',
  '/api/auth/sync-profile',
  '/api/webhook',
  '/api/jets',
  '/api/jets/user',
  '/api/airports',
  '/api/jetshare',
  '/images',
  '/favicon.ico',
  '/jetshare',
  '/jetshare/listings',
  '/gdyup',
  '/gdyup/listings',
  
  // Static assets
  '/_next'
];

// Look for these cookie names as indicators of auth
const AUTH_COOKIE_NAMES = [
  'sb-vjhrmizwqhmafkxbmfwa-auth-token',
  'sb-access-token',
  'sb-refresh-token'
];

// Maximum number of auth redirects to prevent loops
const MAX_AUTH_REDIRECTS = 2;

/**
 * Check if the request has valid authentication cookies
 */
const hasAuthCookies = (req: NextRequest) => {
  const cookies = req.cookies;
  
  // Check for auth cookies
  for (const cookieName of AUTH_COOKIE_NAMES) {
    if (cookies.has(cookieName)) {
      return true;
    }
  }
    
  // Check for auth header (for API routes primarily)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true;
  }
  
  return false;
};

/**
 * Check if a route is exempt from auth checks
 */
const isPublicRoute = (path: string): boolean => {
  // Check for static files
  if (path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)) {
    return true;
  }
  
  // Check if the route is in our public routes list
  return PUBLIC_ROUTES.some(route => {
    // Handle wildcard paths
    if (route.endsWith('*')) {
      const basePath = route.substring(0, route.length - 1);
      return path === basePath || path.startsWith(basePath);
    }
    
    return path === route || path.startsWith(`${route}/`);
  });
};

/**
 * Check if the URL already contains auth redirect params
 */
const hasAuthRedirectParams = (url: URL): boolean => {
  return url.searchParams.has('auth_redirect') || 
         url.searchParams.has('returnUrl') || 
         url.searchParams.has('from');
};

/**
 * Count how many redirects have occurred to prevent loops
 */
const getRedirectCount = (req: NextRequest): number => {
  const count = req.nextUrl.searchParams.get('auth_redirect');
  return count ? parseInt(count, 10) : 0;
};

export function middleware(req: NextRequest) {
  // DEV MODE: Bypass all auth checks when in dev mode
  if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
    console.log(`DEV MODE: Bypassing auth checks for ${req.nextUrl.pathname}`);
    
    // For API routes, ensure we mark it as a DEV request in headers
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-dev-mode', 'true');
      requestHeaders.set('x-dev-user-id', process.env.NEXT_PUBLIC_AUTH_DEV_USER_ID || '');
      
      return NextResponse.next({
        request: { headers: requestHeaders }
      });
    }
    
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  
  // Skip for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Special case for payment paths - these handle their own auth
  if (pathname.startsWith('/gdyup/payment/') || pathname.startsWith('/jetshare/payment/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-payment-flow', 'true');
    
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }
  
  // Handle API routes that require auth
  if (pathname.startsWith('/api/') && !isPublicRoute(pathname)) {
    if (!hasAuthCookies(req)) {
      console.log(`API auth required: ${pathname}`);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized',
          timestamp: Date.now()
        }),
        {
          status: 401,
          headers: { 
            'content-type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          },
        }
      );
    }
    return NextResponse.next();
  }

  // For protected app routes, check auth and redirect to login if needed
  if (!hasAuthCookies(req)) {
    // Get current redirect count to prevent loops
    const redirectCount = getRedirectCount(req);
    
    // If we've redirected too many times, stop and show error page
    if (redirectCount >= MAX_AUTH_REDIRECTS) {
      console.log(`Too many auth redirects (${redirectCount}), showing error page`);
      const errorUrl = new URL('/auth/error', req.url);
      errorUrl.searchParams.set('error', 'redirect_loop');
      return NextResponse.redirect(errorUrl);
    }
    
    // Skip redirect if this is a refresh/retry or we're already trying to authenticate
    if (hasAuthRedirectParams(req.nextUrl) && redirectCount > 0) {
      console.log(`Skipping auth redirect for request with params: ${req.nextUrl.search}`);
      return NextResponse.next();
    }
    
    // Build the login URL with return path
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnUrl', pathname + req.nextUrl.search);
    loginUrl.searchParams.set('t', Date.now().toString());
    loginUrl.searchParams.set('auth_redirect', (redirectCount + 1).toString());
    
    console.log(`Redirecting unauthenticated request from ${pathname} to login`);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, continue to the requested page
  return NextResponse.next();
}

// Configure matcher to exclude static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}; 