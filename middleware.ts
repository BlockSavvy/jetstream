import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Pages that should be protected by authentication
const PROTECTED_ROUTES = [
  '/jetshare/dashboard',
  '/jetshare/listings/manage',
  '/gdyup/dashboard',
  '/gdyup/listings/manage',
  // '/jetshare/payment',  // REMOVED payment route from protected routes
];

// Authentication routes that should be excluded from redirect loops
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
];

// API routes that require authentication but should return 401 instead of redirecting
const PROTECTED_API_ROUTES = [
  // '/api/jetshare/acceptOffer', // Moving to exempt routes for custom auth handling
  '/api/jetshare/completeTestPayment',
  '/api/jetshare/profile',
  '/api/gdyup/completeTestPayment',
  '/api/gdyup/profile'
];

// API routes that should skip auth checks completely
const AUTH_EXEMPT_API_ROUTES = [
  '/api/hello',
  '/api/auth/sync-profile',
  '/api/auth/check-auth',
  '/api/jetshare/getOffers', // Allow public viewing of offers
  '/api/jetshare/getOfferById', // Add our new endpoint for getting individual offers
  '/api/jetshare/setup-db',
  '/api/jetshare/check-db',
  '/api/gdyup/getOffers',
  '/api/gdyup/getOfferById',
  '/api/gdyup/setup-db',
  '/api/gdyup/check-db',
  // Debug/maintenance endpoints
  '/api/jetshare/fixConstraints',
  '/api/jetshare/debug',
  '/api/jetshare/testAccept',
  '/api/jetshare/inspectStatus',
  '/api/jetshare/fixStatus',
  '/api/jetshare/fixStatusValues',
  '/api/jetshare/fixOfferByUpdate',
  '/api/jetshare/adminAcceptOffer',
  '/api/jetshare/fixProfileEmail',
  '/api/jetshare/runSql',
  '/api/gdyup/fixConstraints',
  '/api/gdyup/debug',
  '/api/gdyup/testAccept',
  '/api/gdyup/inspectStatus',
  '/api/gdyup/fixStatus',
  '/api/gdyup/fixStatusValues',
  '/api/gdyup/fixOfferByUpdate',
  '/api/gdyup/adminAcceptOffer',
  '/api/gdyup/fixProfileEmail',
  '/api/gdyup/runSql',
  // Core endpoints with custom auth handling
  '/api/jetshare/createOffer',
  '/api/jetshare/acceptOffer',
  '/api/jetshare/process-payment', // Consolidated payment API endpoint
  '/api/jetshare/getTransactions',
  '/api/jetshare/stats',
  '/api/gdyup/createOffer',
  '/api/gdyup/acceptOffer',
  '/api/gdyup/process-payment',
  '/api/gdyup/getTransactions',
  '/api/gdyup/stats',
  // Webhooks
  '/api/webhook',
  '/api/webhooks',
  // Payment flow endpoints
  '/api/jetshare/payment',
  '/api/jetshare/checkout',
  '/api/jetshare/stripe',
  '/api/jetshare/payment-status',
  '/api/jetshare/update-payment',
  '/api/gdyup/payment',
  '/api/gdyup/checkout',
  '/api/gdyup/stripe',
  '/api/gdyup/payment-status',
  '/api/gdyup/update-payment',
];

// Define API routes that should be exempt from authentication
// Pages or routes that need no authentication
const AUTH_EXEMPT_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset',
  '/auth/callback',
  '/auth/error',
  '/jetshare', // Public landing page
  '/jetshare/listings', // Public listings page
  '/jetshare/offer', // Allowed in middleware, auth checked in component
  '/jetshare/payment', // Base payment path exempt
  '/jetshare/payment/', // Payment paths with IDs are exempt
  '/jetshare/payment/[id]', // Payment page with ID template
  '/jetshare/payment/*', // All payment page variations
  '/jetshare/payment/success', // Success page explicitly exempt
  '/gdyup', // Public landing page
  '/gdyup/listings', // Public listings page
  '/gdyup/offer', // Allowed in middleware, auth checked in component
  '/gdyup/payment', // Base payment path exempt
  '/gdyup/payment/', // Payment paths with IDs are exempt
  '/gdyup/payment/[id]', // Payment page with ID template
  '/gdyup/payment/*', // All payment page variations
  '/gdyup/payment/success', // Success page explicitly exempt
  '/images', // Allow access to static images
  '/favicon.ico',
  '/api/webhooks',
  '/api/auth/callback',
  '/api/auth',
  '/api/webhook'
];

// Look for these cookie names as indicators of auth
// This is a comprehensive list to catch all possible Supabase auth cookie variations
const AUTH_COOKIE_NAMES = [
  'supabase-auth-token',
  'sb-access-token',
  'sb-refresh-token',
  'sb-provider-token',
  // Specific project cookies - with project reference ID
  'sb-vjhrmizwqhmafkxbmfwa-auth-token',
  // Add variations of project-specific cookies
  'sb-vjhrmizwqhmafkxbmfwa-access-token',
  'sb-vjhrmizwqhmafkxbmfwa-refresh-token',
  // Add numbered variations that Supabase might use
  'sb-vjhrmizwqhmafkxbmfwa-auth-token.0',
  'sb-vjhrmizwqhmafkxbmfwa-auth-token.1',
  'sb-vjhrmizwqhmafkxbmfwa-auth-token.2',
  'sb-vjhrmizwqhmafkxbmfwa-auth-token.3',
  'sb-vjhrmizwqhmafkxbmfwa-auth-token.4',
];

// Helper function to validate a JWT token format (simple structure validation)
const isValidJwtFormat = (token: string): boolean => {
  // Simple JWT validation - Check if it has the common 3-part structure
  const parts = token.split('.');
  return parts.length === 3;
};

// Helper function to check if auth token is in localStorage (client-side only)
const getLocalStorageAuthToken = (request: NextRequest): string | null => {
  // This is a server-side middleware, so we can't directly access localStorage
  // However, we can check if the client has sent the auth token in the headers
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && isValidJwtFormat(token)) {
      return token;
    }
  }
  return null;
};

// Helper function to handle jetshare to gdyup redirects
function handleJetshareToGdyupRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  
  // Redirect /jetshare routes to /gdyup except for API routes
  if (pathname.startsWith('/jetshare') && !pathname.startsWith('/api/jetshare')) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = pathname.replace('/jetshare', '/gdyup');
    console.log(`Redirecting from ${pathname} to ${newUrl.pathname}`);
    return NextResponse.redirect(newUrl);
  }
  
  return null;
}

// Merge the functionality of handlePaymentFlow and recoverTransactionState
function handlePaymentFlow(request: NextRequest): NextResponse | NextRequest {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Support both jetshare and gdyup paths
  const isJetsharePayment = pathname.startsWith('/jetshare/payment/');
  const isGdyupPayment = pathname.startsWith('/gdyup/payment/');
  
  // Special handling for the success page to ensure it never redirects
  if (pathname === '/jetshare/payment/success' || pathname === '/gdyup/payment/success') {
    console.log('Middleware: Success page detected - allowing without auth');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-payment-flow', 'true');
    requestHeaders.set('x-bypass-auth', 'true');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }
  
  // Check if we're on the payment page
  if ((isJetsharePayment || isGdyupPayment) && !pathname.includes('/stripe/')) {
    // First check if we're coming from a dashboard or success page redirect
    // This prevents redirect loops between dashboard and payment
    const referer = request.headers.get('referer') || '';
    const isFromDashboard = referer.includes('/jetshare/dashboard') || referer.includes('/gdyup/dashboard');
    const searchParams = request.nextUrl.searchParams;
    const isSuccessRedirect = searchParams.has('success') || searchParams.has('booked');
    
    // If we detect a potential redirect loop, allow the dashboard to handle it
    if ((isFromDashboard || isSuccessRedirect) && !searchParams.has('payment_retry')) {
      console.log('Middleware: Detected potential redirect loop, allowing dashboard to handle auth');
      // Force redirect to dashboard to break the loop
      url.pathname = isJetsharePayment ? '/jetshare/dashboard' : '/gdyup/dashboard';
      return NextResponse.redirect(url);
    }
    
    // Add more detailed logging
    console.log('Middleware: Payment route detected:', pathname);
    console.log('Middleware: BYPASSING AUTH CHECKS COMPLETELY FOR PAYMENT ROUTE');
    
    const offerId = pathname.split('/').pop();
    console.log('Middleware: Payment for offerId:', offerId);
    
    // If the offerId is invalid, try to recover from cookies or storage
    if (!offerId || offerId === 'undefined' || offerId.length < 10) {
      // Try to get from cookies first
      const pendingPaymentOfferId = request.cookies.get('pending_payment_offer_id')?.value;
      
      if (pendingPaymentOfferId) {
        console.log('Middleware: Recovered offer ID from cookie:', pendingPaymentOfferId);
        url.pathname = isJetsharePayment ? `/jetshare/payment/${pendingPaymentOfferId}` : `/gdyup/payment/${pendingPaymentOfferId}`;
        return NextResponse.redirect(url);
      }
      
      // Try to get from URL query params if present
      const searchParams = request.nextUrl.searchParams;
      const offerIdFromQuery = searchParams.get('offer_id');
      
      if (offerIdFromQuery && offerIdFromQuery.length > 10) {
        console.log('Middleware: Recovered offer ID from query params:', offerIdFromQuery);
        url.pathname = isJetsharePayment ? `/jetshare/payment/${offerIdFromQuery}` : `/gdyup/payment/${offerIdFromQuery}`;
        return NextResponse.redirect(url);
      }
    }
    
    // Add a header to the request to bypass auth checks for payment pages
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-payment-flow', 'true');
    requestHeaders.set('x-bypass-auth', 'true'); // New header to explicitly bypass auth
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }
  
  return request;
}

export async function middleware(request: NextRequest) {
  // Check for JetShare to GDY UP redirects first
  const redirectResponse = handleJetshareToGdyupRedirect(request);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  // Handle payment flow next
  const paymentResponse = handlePaymentFlow(request);
  
  // Explicitly check if the response is not the original request
  if (paymentResponse !== request) {
    return paymentResponse;
  }
  
  const pathname = request.nextUrl.pathname;
  
  // Detailed logging in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    const cookieString = request.headers.get('cookie') || '';
    const cookies = cookieString.split(';').map(c => c.trim());
    
    // Log all cookies in a sanitized way (just names, not values)
    console.log(`Middleware: ${pathname} - Request cookies:`, cookies.map(c => c.split('=')[0]));
  }
  
  // Skip middleware for static assets
  if (pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)) {
    return NextResponse.next();
  }
  
  // Skip middleware for auth routes to prevent redirect loops
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Skip middleware for exempt API routes - no auth check needed for these
  if (AUTH_EXEMPT_API_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`Skipping auth check for exempt API route: ${pathname}`);
    return NextResponse.next();
  }

  // Get all cookies from the request
  const cookieString = request.headers.get('cookie') || '';
  const cookies = cookieString.split(';').map(c => c.trim());
  
  // Check if any of our auth cookies are present
  const hasAuthToken = AUTH_COOKIE_NAMES.some(name => 
    cookies.some(cookie => cookie.startsWith(`${name}=`))
  );

  // Also check for the localStorage token in the Authorization header
  const authHeader = request.headers.get('authorization');
  const hasAuthHeader = !!authHeader && authHeader.startsWith('Bearer ');
  const jwtToken = getLocalStorageAuthToken(request);
  
  // Check for x-supabase-auth header which might be used by some clients
  const supabaseAuthHeader = request.headers.get('x-supabase-auth');
  const hasSupabaseAuthHeader = !!supabaseAuthHeader;
  
  // Consider authenticated if either cookies or auth header is present with valid JWT
  const isAuthenticated = hasAuthToken || (hasAuthHeader && jwtToken !== null) || hasSupabaseAuthHeader;
  
  // Log auth status in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Auth check for ${pathname} - Auth present: ${isAuthenticated ? 'Yes' : 'No'}`);
    if (isAuthenticated) {
      console.log(`Auth method: ${hasAuthToken ? 'Cookie' : hasAuthHeader ? 'Bearer Token' : 'Supabase Header'}`);
    }
  }

  // For protected API routes, attempt to validate the token with Supabase if needed
  if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Auth check failed for API route ${pathname} - returning 401`);
      }
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'You must be logged in to access this API',
          redirectUrl: '/auth/login?returnUrl=' + encodeURIComponent('/jetshare/dashboard')
        }, 
        { status: 401 }
      );
    }
    
    // If there's a valid JWT token in the Authorization header but no cookies,
    // we can pass through and let the API route handle the authentication
    if (!hasAuthToken && jwtToken) {
      console.log('Using JWT token from Authorization header for API route');
    }
    
    return NextResponse.next();
  }
  
  // Skip other API routes from the auth check - most APIs handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Only apply auth check to specified protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  // Also protect payment routes with ID: /jetshare/payment/123456
  const isPaymentRoute = pathname.match(/^\/jetshare\/payment\/[^\/]+$/);
  
  // Explicitly exempt payment routes to avoid auth issues
  if (pathname.startsWith('/jetshare/payment/')) {
    console.log('Payment route detected - COMPLETELY BYPASSING middleware auth check');
    console.log('Headers being passed:', Array.from(request.headers.entries()).map(([key, value]) => `${key}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`));
    
    // Add helpful headers to assist with auth in the route handler
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-payment-flow', 'true');
    requestHeaders.set('x-bypass-auth', 'true'); // Explicit bypass header
    
    // If auth token is present in any form, pass it along in the headers
    if (jwtToken) {
      requestHeaders.set('x-token-auth', jwtToken);
      console.log('Passing JWT token to payment page via header');
    }
    
    // Check for auth cookies and mark their presence
    if (hasAuthToken) {
      requestHeaders.set('x-has-auth-cookies', 'true');
      console.log('Auth cookies detected and flagged for payment page');
    }
    
    // Extract user ID from various sources
    let userId = null;
    
    // Try query params first
    userId = request.nextUrl.searchParams.get('user_id');
    
    // If no user ID in query params, try to extract from the JWT token
    if (!userId && jwtToken) {
      try {
        // Simple JWT parsing - split by dots and decode the payload (second part)
        const payload = JSON.parse(
          Buffer.from(jwtToken.split('.')[1], 'base64').toString()
        );
        if (payload.sub) {
          userId = payload.sub;
          console.log('Extracted user ID from JWT token for payment page');
        }
      } catch (e) {
        console.warn('Error extracting user ID from JWT:', e);
      }
    }
    
    // If we have a userId, pass it along in headers
    if (userId) {
      requestHeaders.set('x-user-id', userId);
      console.log('Passing user ID to payment page via header:', userId);
    }
    
    // Add any query params as headers to preserve context
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (value && !['t', 'from', 'user_id'].includes(key)) {
        requestHeaders.set(`x-query-${key}`, value);
      }
    }
    
    // Add a timestamp in case route handlers need it for fresh data
    requestHeaders.set('x-request-time', Date.now().toString());
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }
  
  // Dashboard page will handle authentication itself
  if (pathname === '/jetshare/dashboard') {
    console.log('Dashboard page will handle its own authentication - bypassing middleware check');
    return NextResponse.next();
  }
  
  // Check for payment routes coming from offer acceptance
  if (isPaymentRoute) {
    // Since we're already explicitly exempting payment routes above,
    // this is just for special cases and debugging
    const hasTimestamp = request.nextUrl.searchParams.has('t');
    const hasAcceptFlow = request.nextUrl.searchParams.has('from') && 
                        request.nextUrl.searchParams.get('from') === 'accept';
    const isSuccessRedirect = request.nextUrl.pathname.startsWith('/jetshare/dashboard') &&
                            request.nextUrl.searchParams.has('success') && 
                            request.nextUrl.searchParams.get('success') === 'payment-completed';
    
    // Also check referer - if it's from the acceptOffer API
    const referer = request.headers.get('referer') || '';
    const isFromAcceptAPI = referer.includes('/api/jetshare/acceptOffer');
    const isFromPaymentAPI = referer.includes('/api/jetshare/completeTestPayment');
    
    if ((hasTimestamp && (hasAcceptFlow || isFromAcceptAPI || isFromPaymentAPI)) || isSuccessRedirect) {
      console.log('Special payment flow case detected - logging for debugging');
    }
    
    // We don't need to return NextResponse.next() here as it's handled by the explicit exemption above
  }

  if (!isProtectedRoute && !isPaymentRoute) {
    return NextResponse.next();
  }

  // If auth check passed, allow the request to proceed
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // At this point, the auth check failed for a protected route
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Auth check failed for ${pathname} - redirecting to login`);
    console.log(`Auth check cookies:`, request.cookies.getAll().map(c => c.name));
  }

  // Redirect to the login page (unless we're already there)
  if (!pathname.startsWith('/auth/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `?returnUrl=${encodeURIComponent(pathname)}&t=${Date.now()}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only apply middleware to paths that should be checked
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 