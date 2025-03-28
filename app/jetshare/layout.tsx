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
    // Only continue once auth state is loaded
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
  
  // Create inner content based on loading state
  const content = loading && needsAuth ? (
    <div className="animate-pulse text-center">
      <div className="text-lg font-medium">Loading JetShare...</div>
      <div className="text-sm text-gray-500 mt-2">Checking authentication...</div>
    </div>
  ) : (
    children
  );
  
  // Base layout content that always renders
  return (
    <div className="flex flex-col min-h-screen">
      <JetShareHeader />
      
      <main className="flex-1 pb-12 flex justify-center items-center">
        {content}
      </main>
      
      <JetShareFooter />
    </div>
  );
} 