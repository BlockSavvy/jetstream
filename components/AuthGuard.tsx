'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard component that shows a loading state while auth is being determined
 * It relies on the middleware.ts to handle actual route protection and redirects
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  
  // Show a simple loading spinner while auth state is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Auth state is determined, render children
  return <>{children}</>;
} 