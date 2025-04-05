'use client';

import { useState, useEffect } from 'react';
import { UiProvider } from './components/ui-context';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { JetCreateDialog } from './components/dialogs/jet-create-dialog';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Only run on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return (
    <UiProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-950">
        <div className="w-64 md:block hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          {/* Sidebar placeholder */}
          <div className="p-4 font-bold text-lg">Admin Dashboard</div>
        </div>
        <div className="flex-1 overflow-x-hidden">
          <main className={cn(
            "p-6 max-w-7xl mx-auto",
            !isMounted && "opacity-0" // Hide content until mounted to prevent layout shift
          )}>
            {children}
          </main>
        </div>
        
        {/* Only include dialogs that we've created so far */}
        <JetCreateDialog />
        
        {/* Global toast notification container */}
        <Toaster position="top-right" />
      </div>
    </UiProvider>
  );
} 