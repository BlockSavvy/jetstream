'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import JetShareHeader from './components/JetShareHeader';
import { DevModeHelpers } from './components/DevModeHelpers';
import { useAuth } from '@/components/auth-provider';

// Routes that should have AuthGuard applied
const PROTECTED_ROUTES = [
  '/jetshare/dashboard',
  '/jetshare/offer',
  '/jetshare/listings/manage',
  '/jetshare/payment',
];

export default function JetShareLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Check if current path needs auth protection
  const needsAuth = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));
  
  useEffect(() => {
    // Only handle auth for protected routes
    if (!needsAuth) {
      setLoading(false);
      return;
    }
    
    // Wait for auth state to stabilize
    if (authLoading) {
      return;
    }
    
    // If no user but route needs auth, redirect to login
    if (!user && needsAuth) {
      console.log('JetShare layout: No authenticated user for protected route:', pathname);
      const returnUrl = encodeURIComponent(window.location.href);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      return;
    }
    
    // We have a user or don't need one - proceed
    setLoading(false);
  }, [pathname, user, authLoading, needsAuth, router]);
  
  // Simple loading state for protected routes
  if (loading && needsAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <JetShareHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }
  
  // Base layout content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <JetShareHeader />
      <main className="flex-grow">
        {children}
      </main>
      <DevModeHelpers />
    </div>
  );
} 