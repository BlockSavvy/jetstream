'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Menu, 
  X, 
  Search, 
  PlaneTakeoff, 
  BarChart4, 
  LogOut,
  ChevronLeft,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

export default function JetShareHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Define menu items based on authentication status
  const getMenuItems = () => {
    // Items available to all users
    const publicItems = [
      {
        name: 'Home',
        path: '/jetshare',
        icon: <Home className="h-5 w-5" />
      },
      {
        name: 'Listings',
        path: '/jetshare/listings',
        icon: <Search className="h-5 w-5" />
      }
    ];
    
    // Items that require authentication
    const authItems = user ? [
      {
        name: 'Offer a Share',
        path: '/jetshare/offer',
        icon: <PlaneTakeoff className="h-5 w-5" />
      },
      {
        name: 'Dashboard',
        path: '/jetshare/dashboard',
        icon: <BarChart4 className="h-5 w-5" />
      }
    ] : [];
    
    // Debug item (development only)
    const devItems = process.env.NODE_ENV === 'development' ? [
      {
        name: 'Debug',
        path: '/jetshare/debug',
        icon: <span className="text-xs p-1 bg-amber-100 text-amber-800 rounded">DEV</span>
      }
    ] : [];
    
    return [...publicItems, ...authItems, ...devItems];
  };

  const menuItems = getMenuItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  const handleSignIn = () => {
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link 
              href="/jetshare" 
              className="text-2xl font-bold text-amber-500"
            >
              JetShare
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center space-x-1 text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "text-amber-500"
                    : "text-muted-foreground hover:text-amber-500"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            
            <Link href="/" className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-amber-500">
              <ChevronLeft className="h-5 w-5" />
              <span>Back to JetStream</span>
            </Link>
            
            {/* Conditional auth buttons */}
            {user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignIn}
                className="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mt-4 space-y-4 md:hidden">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                  isActive(item.path)
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
            
            <Link 
              href="/"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to JetStream</span>
            </Link>
            
            {/* Conditional auth buttons for mobile */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
} 