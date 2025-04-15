export default function middleware(req) {
  // Just pass through all requests - this is a static site
  return;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (Static assets like JS, CSS, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
}; 