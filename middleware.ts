import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Pages that should be protected by authentication
const PROTECTED_ROUTES = [
  '/jetshare/dashboard',
  '/jetshare/listings/manage',
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
  '/api/jetshare/profile'
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
  // Core endpoints with custom auth handling
  '/api/jetshare/createOffer',
  '/api/jetshare/acceptOffer',
  '/api/jetshare/process-payment', // Consolidated payment API endpoint
  '/api/jetshare/getTransactions',
  '/api/jetshare/stats',
  // Webhooks
  '/api/webhook',
  '/api/webhooks',
  // Payment flow endpoints
  '/api/jetshare/payment',
  '/api/jetshare/checkout',
  '/api/jetshare/stripe',
  '/api/jetshare/payment-status',
  '/api/jetshare/update-payment',
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

// Merge the functionality of handlePaymentFlow and recoverTransactionState
function handlePaymentFlow(request: NextRequest): NextResponse | NextRequest {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Special handling for the success page to ensure it never redirects
  if (pathname === '/jetshare/payment/success') {
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
  if (pathname.startsWith('/jetshare/payment/') && !pathname.includes('/stripe/')) {
    // First check if we're coming from a dashboard or success page redirect
    // This prevents redirect loops between dashboard and payment
    const referer = request.headers.get('referer') || '';
    const isFromDashboard = referer.includes('/jetshare/dashboard');
    const searchParams = request.nextUrl.searchParams;
    const isSuccessRedirect = searchParams.has('success') || searchParams.has('booked');
    
    // If we detect a potential redirect loop, allow the dashboard to handle it
    if ((isFromDashboard || isSuccessRedirect) && !searchParams.has('payment_retry')) {
      console.log('Middleware: Detected potential redirect loop, allowing dashboard to handle auth');
      // Force redirect to dashboard to break the loop
      url.pathname = '/jetshare/dashboard';
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
        url.pathname = `/jetshare/payment/${pendingPaymentOfferId}`;
        return NextResponse.redirect(url);
      }
      
      // Try to get from URL query params if present
      const searchParams = request.nextUrl.searchParams;
      const offerIdFromQuery = searchParams.get('offer_id');
      
      if (offerIdFromQuery && offerIdFromQuery.length > 10) {
        console.log('Middleware: Recovered offer ID from query params:', offerIdFromQuery);
        url.pathname = `/jetshare/payment/${offerIdFromQuery}`;
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

// This middleware ensures all pages use dynamic rendering
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Set headers to force dynamic behavior
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  
  return response;
}

// Run middleware on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 