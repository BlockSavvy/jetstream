'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin Root Page
 * 
 * This is a simple redirector that sends users to the overview page
 * when they access the admin root path.
 */
export default function AdminRootPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/admin/overview');
  }, [router]);
  
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Redirecting to overview...</p>
      </div>
    </div>
  );
} 