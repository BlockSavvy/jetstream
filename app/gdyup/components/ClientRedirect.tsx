'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ url }: { url: string }) {
  const router = useRouter();
  
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DAFF0D]"></div>
      <p className="mt-4 text-gray-500 font-medium">Redirecting...</p>
      <p className="mt-2 text-sm text-gray-400">If you are not redirected, 
        <button 
          onClick={() => window.location.href = url}
          className="ml-1 text-[#DAFF0D] hover:underline focus:outline-none"
        >
          click here
        </button>
      </p>
    </div>
  );
} 