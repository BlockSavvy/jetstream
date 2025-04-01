// Configuration to ensure pages are never statically generated
// Import this file in any client component that uses browser APIs

// Forces dynamic rendering
export const dynamic = 'force-dynamic';

// Prevents caching
export const fetchCache = 'force-no-store';

// Disables incremental static regeneration
export const revalidate = 0;

// Prevents static site generation
export const generateStaticParams = () => {
  return [];
};

// Prevents automatic static optimization
export const config = {
  unstable_runtimeJS: true
}; 