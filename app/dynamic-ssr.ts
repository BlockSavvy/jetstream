// Configuration to ensure pages are never statically generated
// Import this file in any client component that uses browser APIs or needs server-side rendering

// Forces dynamic rendering for all pages that import this file
export const dynamic = 'force-dynamic';

// Prevents caching
export const fetchCache = 'force-no-store';

// Disables incremental static regeneration
export const revalidate = 0; 