'use client';

import { ReactNode, useEffect, useState } from 'react';
import JetShareHeader from './components/JetShareHeader';
import { useAuth } from '@/components/auth-provider';
import { Suspense } from 'react';
import cookies from 'next/headers';
import { Toaster } from "@/components/ui/sonner"

export default function JetShareLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Console log the auth state for debugging
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true') {
      console.log('DEV MODE: JetShare Layout Auth State:', { 
      isAuthenticated: !!user, 
        authLoading 
    });
    }
  }, [user, authLoading]);
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = typeof window !== 'undefined' && 
        (window.innerWidth <= 768 || 
         /Android/i.test(navigator.userAgent) ||
         /iPhone|iPad|iPod/i.test(navigator.userAgent));
      
      setIsMobile(!!isMobileDevice);
      
      try {
        localStorage.setItem('jetstream_is_mobile', isMobileDevice ? 'true' : 'false');
      } catch (e) {
        console.warn('Could not store mobile preference:', e);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background dark">
        <div className="flex items-center justify-center h-screen">
          <p>Loading JetShare...</p>
        </div>
      </main>
    );
    }
  
  return (
    <main className={`min-h-screen bg-background dark ${isMobile ? 'jetstream-mobile' : ''}`}>
      <JetShareHeader />
      <div className={`jetshare-content-container ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}`}>
        {children}
      </div>
    </main>
  );
} 