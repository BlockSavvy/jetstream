'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import JetShareHeader from './components/JetShareHeader';
import { useAuth } from '@/components/auth-provider';
import { Toaster } from 'sonner';
import JetShareFooter from './components/JetShareFooter';

// Routes that should have AuthGuard applied
const PROTECTED_ROUTES = [
  '/jetshare/dashboard',
  '/jetshare/offer',
  '/jetshare/create',
  '/jetshare/transaction'
];

export default function JetShareLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Check if current path should be protected
  const needsAuth = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));
  
  useEffect(() => {
    console.log('JetShare layout auth check for:', pathname);
    
    // Wait for auth state to stabilize
    if (authLoading) {
      return;
    }
    
    // If no user but route needs auth, redirect to login
    if (!user && needsAuth) {
      console.log('JetShare layout: No authenticated user for protected route:', pathname);
      router.push('/auth/login?redirect=' + encodeURIComponent(pathname || '/jetshare'));
      return;
    }
    
    // We have a user or don't need one - proceed
    setLoading(false);
  }, [pathname, user, authLoading, needsAuth, router]);
  
  // Simple loading state for protected routes
  if (loading && needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-lg font-medium">Loading JetShare...</div>
          <div className="text-sm text-gray-500 mt-2">Checking authentication...</div>
        </div>
      </div>
    );
  }
  
  // Base layout content
  return (
    <div className="flex flex-col min-h-screen">
      <JetShareHeader />
      
      <main className="flex-1 pb-12">
        {children}
      </main>
      
      <JetShareFooter />
      <Toaster position="top-center" />
    </div>
  );
} 