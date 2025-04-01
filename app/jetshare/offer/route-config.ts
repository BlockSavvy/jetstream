// This is a server-side config file that sets rendering options for this route
// It doesn't contain any client-side code or components

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0; 