'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

export default function ClientRedirect({ url }: { url: string }) {
  const router = useRouter();
  
  // Get theme helpers
  const { getThemedTextClasses, getThemedButtonClasses } = useGdyupTheme();
  
  // Use multiple redirect strategies for better reliability
  useEffect(() => {
    console.log(`ClientRedirect: Redirecting to ${url}`);
    
    // Strategy 1: Use Next.js router (cleanest, but sometimes has issues with dynamic routes)
    try {
      router.replace(url);
      console.log('ClientRedirect: router.replace() called');
    } catch (routerError) {
      console.error('ClientRedirect: router.replace() failed:', routerError);
      // If router fails, fall back to direct navigation
      window.location.href = url;
    }
    
    // Strategy 2: Fallback with a direct location change after a short delay
    const directNavTimer = setTimeout(() => {
      console.log('ClientRedirect: Fallback direct navigation triggered');
      window.location.href = url;
    }, 500);
    
    // Strategy 3: Final fallback with a longer timeout as last resort
    const finalFallbackTimer = setTimeout(() => {
      console.log('ClientRedirect: Final fallback navigation triggered');
      window.location.replace(url);
    }, 2000);
    
    return () => {
      clearTimeout(directNavTimer);
      clearTimeout(finalFallbackTimer);
    };
  }, [router, url]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
      <div className={cn("animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gdyup-primary")}></div>
      <p className={cn("mt-4 font-medium", getThemedTextClasses('muted'))}>Redirecting...</p>
      <p className={cn("mt-2 text-sm", getThemedTextClasses('muted'))}>If you are not redirected, 
        <button 
          onClick={() => window.location.href = url}
          className={cn("ml-1 hover:underline focus:outline-none", getThemedTextClasses('primary'))}
        >
          click here
        </button>
      </p>
    </div>
  );
} 