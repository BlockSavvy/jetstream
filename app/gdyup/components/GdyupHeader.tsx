'use client';

import { useEffect, useState } from 'react';
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
  LogIn,
  User,
  Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';

export default function GdyupHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasLocalAuth, setHasLocalAuth] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check for auth in localStorage as a fallback
    const checkLocalAuth = () => {
      try {
        const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        const userId = localStorage.getItem('jetstream_user_id');
        
        // If we have either token data or user_id stored, consider this as potential auth
        setHasLocalAuth(!!(tokenData || userId));
        
        // If we have token but no user in Auth provider, try to restore session
        if ((tokenData || userId) && !user && !loading) {
          console.log('Header: Found auth data in localStorage but no user in context - refreshing auth state');
          
          // This will trigger the auth provider to try restoring the session
          const refreshAuth = async () => {
            try {
              const supabase = createClient();
              await supabase.auth.refreshSession();
            } catch (e) {
              console.warn('Header: Error refreshing session:', e);
            }
          };
          
          refreshAuth();
        }
      } catch (e) {
        console.warn('Header: Error checking localStorage:', e);
        setHasLocalAuth(false);
      }
    };
    
    checkLocalAuth();
    
    // Re-check authentication every 5 seconds in case it changes
    // This helps when redirecting from auth page back to GDY UP
    const intervalId = setInterval(checkLocalAuth, 5000);
    
    return () => clearInterval(intervalId);
  }, [user, loading]);
  
  // Determine if user is authenticated - either through Auth provider or localStorage
  const isAuthenticated = !!user || (!loading && isClient && hasLocalAuth);

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Define menu items based on authentication status
  const getMenuItems = () => {
    // Items available to all users
    const publicItems = [
      {
        name: 'Home',
        path: '/gdyup',
        icon: <Home className="h-5 w-5" />
      },
      {
        name: 'Listings',
        path: '/gdyup/listings',
        icon: <Search className="h-5 w-5" />
      }
    ];
    
    // Items that require authentication
    const authItems = isAuthenticated ? [
      {
        name: 'Offer a Share',
        path: '/gdyup/offer',
        icon: <PlaneTakeoff className="h-5 w-5" />
      },
      {
        name: 'Dashboard',
        path: '/gdyup/dashboard',
        icon: <BarChart4 className="h-5 w-5" />
      },
      {
        name: 'My Jets',
        path: '/gdyup/jets',
        icon: <Plane className="h-5 w-5" />
      }
    ] : [];
    
    // Debug item (development only)
    const devItems = process.env.NODE_ENV === 'development' ? [
      {
        name: 'Debug',
        path: '/gdyup/debug',
        icon: <span className="text-xs p-1 bg-amber-100 text-amber-800 rounded">DEV</span>
      }
    ] : [];
    
    return [...publicItems, ...authItems, ...devItems];
  };

  const menuItems = getMenuItems();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use direct navigation to avoid router issues
      window.location.href = '/gdyup';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  const handleSignIn = () => {
    // Redirect back to GDY UP after login with current path
    const currentPath = pathname || '/gdyup';
    const timestamp = Date.now(); // Add timestamp to avoid caching issues
    // Use direct navigation for more reliable auth cookies
    window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentPath)}&t=${timestamp}`;
  };
  
  // Handle navigation to protected routes
  const handleProtectedNavigation = (path: string) => {
    // Special handling for offer pages - always allow during development
    if (process.env.NODE_ENV === 'development' || 
        path.startsWith('/gdyup/offer/new') || 
        path.startsWith('/gdyup/offer/edit')) {
      console.log('Direct navigation to', path);
      window.location.href = path;
      return;
    }

    // In production, check authentication for other protected routes
    if (!isAuthenticated) {
      // If not authenticated, redirect to login with return URL
      const timestamp = Date.now();
      window.location.href = `/auth/login?returnUrl=${encodeURIComponent(path)}&t=${timestamp}`;
      return;
    }
    
    // If authenticated, use direct navigation for better cookie handling
    window.location.href = path;
  };

  // GDY UP brand colors - updated for better contrast
  const primaryColor = "#DAFF0D"; // Enhanced brightness for better contrast against dark bg
  const secondaryColor = "#FF4B47"; // Keep the secondary color

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800" style={{ "--primary-color": primaryColor, "--secondary-color": secondaryColor } as React.CSSProperties}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo - Updated for better visibility */}
          <div className="flex items-center gap-2">
            <Link href="/gdyup" className="flex items-center">
              <Image 
                src="/assets/gdyup-logo.svg" 
                width={160} 
                height={48} 
                alt="GDY UP Logo"
                className="h-10 w-auto object-contain gdyup-logo" 
                priority
                unoptimized={true}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-6">
            {menuItems.map((item) => {
              // Determine if this is a protected route
              const isProtectedRoute = ['/gdyup/dashboard', '/gdyup/offer', '/gdyup/jets'].some(route => 
                item.path.startsWith(route)
              );
              
              // For protected routes, use onClick with the handler
              if (isProtectedRoute) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleProtectedNavigation(item.path)}
                    className={cn(
                      "flex items-center space-x-1 text-sm font-medium transition-colors",
                      isActive(item.path)
                        ? { color: primaryColor }
                        : "text-gray-100 hover:text-white" // Improved from gray-300 to gray-100
                    )}
                    style={isActive(item.path) ? { color: primaryColor } : {}}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                );
              }
              
              // For non-protected routes, use regular Link
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium transition-colors",
                    isActive(item.path)
                      ? { color: primaryColor }
                      : "text-gray-100 hover:text-white" // Improved from gray-300 to gray-100
                  )}
                  style={isActive(item.path) ? { color: primaryColor } : {}}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Divider */}
            <div className="h-5 w-px bg-gray-700 mx-1" />
            
            {/* Profile link */}
            <button 
              onClick={() => handleProtectedNavigation('/gdyup/profile')}
              className={cn(
                "flex items-center space-x-1 text-sm font-medium transition-colors",
                isActive('/gdyup/profile')
                  ? { color: primaryColor }
                  : "text-gray-100 hover:text-white" // Improved from gray-300 to gray-100
              )}
              style={isActive('/gdyup/profile') ? { color: primaryColor } : {}}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>
            
            {/* More dropdown */}
            <div className="relative group">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm text-gray-100 hover:text-white" // Improved from gray-300 to gray-100
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                More
              </Button>
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link 
                    href="/" 
                    className="flex px-4 py-2 text-sm text-gray-100 hover:bg-gray-800 hover:text-white" // Improved from gray-300 to gray-100
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    <span>Back to JetStream</span>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Conditional auth buttons */}
            {isAuthenticated ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-red-300 hover:text-red-200 hover:bg-red-900/30" // Improved from red-400 to red-300 for better contrast
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignIn}
                style={{ color: primaryColor }}
                className="hover:bg-gray-800 hover:brightness-110" // Added brightness increase on hover
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-gray-100 hover:bg-gray-800 hover:text-white" // Improved from gray-400 to gray-100
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
            {menuItems.map((item) => {
              // Determine if this is a protected route
              const isProtectedRoute = ['/gdyup/dashboard', '/gdyup/offer', '/gdyup/jets'].some(route => 
                item.path.startsWith(route)
              );
              
              // For protected routes, use onClick with the handler
              if (isProtectedRoute) {
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleProtectedNavigation(item.path);
                    }}
                    className={cn(
                      "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      isActive(item.path)
                        ? "bg-gray-800 text-white"
                        : "text-gray-100 hover:bg-gray-800 hover:text-white" // Improved from gray-300 to gray-100
                    )}
                    style={isActive(item.path) ? { color: primaryColor } : {}}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                );
              }
              
              // For non-protected routes, use regular Link
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive(item.path)
                      ? "bg-gray-800 text-white"
                      : "text-gray-100 hover:bg-gray-800 hover:text-white" // Improved from gray-300 to gray-100
                  )}
                  style={isActive(item.path) ? { color: primaryColor } : {}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Profile link */}
            <button
              onClick={() => {
                handleProtectedNavigation('/gdyup/profile');
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                isActive('/gdyup/profile')
                  ? { color: primaryColor }
                  : "text-gray-100 hover:text-white hover:bg-gray-800"
              )}
              style={isActive('/gdyup/profile') ? { color: primaryColor } : {}}
            >
              <User className="h-5 w-5 mr-2" />
              <span>Profile</span>
            </button>
            
            <div className="h-px bg-gray-700 my-2" />
            
            {/* Conditional auth buttons for mobile */}
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900/30" // Improved from red-400 to red-300
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 hover:brightness-110" // Added brightness increase on hover
                style={{ color: primaryColor }}
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </button>
            )}
            
            {/* Move back to JetStream link to bottom */}
            <div className="h-px bg-gray-700 my-2" />
            
            <Link 
              href="/"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-100 hover:bg-gray-800 hover:text-white" // Improved from gray-400 to gray-100
              onClick={() => setMobileMenuOpen(false)}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to JetStream</span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
} 