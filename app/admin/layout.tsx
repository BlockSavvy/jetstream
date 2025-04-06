'use client';

import { useState, useEffect } from 'react';
import { UiProvider } from './components/ui-context';
import Sidebar from './components/sidebar';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Only run on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return (
    <UiProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-950 mt-16 pt-2">
        {/* Desktop Sidebar - Add top padding and fixed positioning */}
        <div className="w-64 md:block hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 md:sticky md:top-16 md:h-[calc(100vh-4rem)] overflow-y-auto">
          <Sidebar />
        </div>
        
        {/* Mobile Nav - Add top margin */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-16 z-10">
          <div className="font-bold text-lg">JetStream Admin</div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </Button>
        </div>
        
        {/* Mobile Sidebar - Adjust for the top nav */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 mt-16" onClick={() => setMobileNavOpen(false)}>
            <div 
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-950 h-[calc(100vh-4rem)] top-16" 
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar />
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-x-hidden">
          <main className={cn(
            "p-6 max-w-7xl mx-auto",
            !isMounted && "opacity-0" // Hide content until mounted to prevent layout shift
          )}>
            {children}
          </main>
        </div>
        
        {/* Global toast notification container */}
        <Toaster position="top-right" />
      </div>
    </UiProvider>
  );
} 