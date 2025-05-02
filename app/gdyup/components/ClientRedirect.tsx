'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ url }: { url: string }) {
  const router = useRouter();
  
  // Use setTimeout(0) to ensure this happens after render cycle
  useEffect(() => {
    // Attempt immediate redirect
    router.replace(url);
    
    // If that doesn't work, try again with a timeout
    const timer = setTimeout(() => {
      console.log('Fallback redirect to:', url);
      window.location.href = url;
    }, 2000);
    
    return () => clearTimeout(timer);
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