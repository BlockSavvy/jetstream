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
  UserPlus,
  User,
  Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-provider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

export default function GdyupHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Determine if user is authenticated
  const isAuthenticated = !!user && !loading;

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/gdyup' && pathname === '/gdyup') return true;
    if (path !== '/gdyup' && pathname.startsWith(path)) return true;
    return false;
  };

  // Define menu items based on authentication status
  const getMenuItems = () => {
    // Items available to all users
    const publicItems = [
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
      toast.success('Signed out successfully');
      router.push('/gdyup');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out failed');
    }
  };
  
  const handleSignIn = () => {
    router.push('/gdyup/auth/login');
  };
  
  const handleSignUp = () => {
    router.push('/gdyup/auth/signup');
  };
  
  // Handle navigation to protected routes
  const handleProtectedNavigation = (path: string) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to continue');
      router.push(`/gdyup/auth/login?returnUrl=${encodeURIComponent(path)}`);
      return;
    }
    
    router.push(path);
  };

  // GDY UP brand colors
  const primaryColor = "#DAFF0D"; 
  const secondaryColor = "#FF4B47";

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800" style={{ "--primary-color": primaryColor, "--secondary-color": secondaryColor } as React.CSSProperties}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/gdyup" className="flex items-center">
              <Image 
                src="/assets/gdyup-logo-v2.svg"
                alt="GDYUP Logo"
                width={150}
                height={40}
                className="h-10 w-auto object-contain gdyup-logo"
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
                        : "text-gray-100 hover:text-white"
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
                      : "text-gray-100 hover:text-white"
                  )}
                  style={isActive(item.path) ? { color: primaryColor } : {}}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Authentication Buttons for Desktop */}
            <div className="h-5 w-px bg-gray-700 mx-1" />
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium transition-colors",
                    isActive('/gdyup/profile')
                      ? { color: primaryColor }
                      : "text-gray-100 hover:text-white"
                  )}
                  style={isActive('/gdyup/profile') ? { color: primaryColor } : {}}
                >
                  <User className="h-5 w-5" />
                  <span>{user?.email?.split('@')[0] || 'Profile'}</span>
                </button>
                
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link 
                        href="/gdyup/profile" 
                        className="flex px-4 py-2 text-sm text-gray-100 hover:bg-gray-800 hover:text-white"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User className="h-5 w-5 mr-2" />
                        <span>Edit Profile</span>
                      </Link>
                      
                      <Link 
                        href="/gdyup/dashboard" 
                        className="flex px-4 py-2 text-sm text-gray-100 hover:bg-gray-800 hover:text-white"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <BarChart4 className="h-5 w-5 mr-2" />
                        <span>Dashboard</span>
                      </Link>
                      
                      <Link 
                        href="/" 
                        className="flex px-4 py-2 text-sm text-gray-100 hover:bg-gray-800 hover:text-white"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <ChevronLeft className="h-5 w-5 mr-2" />
                        <span>Back to JetStream</span>
                      </Link>
                      
                      <button 
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="flex w-full px-4 py-2 text-sm text-red-300 hover:bg-red-900/30 hover:text-red-200"
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignIn}
                  className="text-white hover:text-white hover:bg-gray-800"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                
                <Button 
                  onClick={handleSignUp}
                  size="sm"
                  style={{ backgroundColor: primaryColor, color: 'black' }}
                  className="hover:brightness-110"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden">
            {!isAuthenticated && (
              <Button
                onClick={handleSignUp}
                size="sm"
                style={{ backgroundColor: primaryColor, color: 'black' }}
                className="hover:brightness-110"
              >
                Sign Up
              </Button>
            )}
            
            <button
              type="button"
              className="rounded-md p-2 text-gray-100 hover:bg-gray-800 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mt-4 space-y-2 md:hidden">
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
                        : "text-gray-100 hover:bg-gray-800 hover:text-white"
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
                      : "text-gray-100 hover:bg-gray-800 hover:text-white"
                  )}
                  style={isActive(item.path) ? { color: primaryColor } : {}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            <div className="h-px bg-gray-700 my-2" />
            
            {/* Mobile Authentication Options */}
            {isAuthenticated ? (
              <>
                <Link
                  href="/gdyup/profile"
                  className={cn(
                    "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive('/gdyup/profile')
                      ? "bg-gray-800"
                      : "text-gray-100 hover:bg-gray-800 hover:text-white"
                  )}
                  style={isActive('/gdyup/profile') ? { color: primaryColor } : {}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                
                <Link
                  href="/gdyup/dashboard"
                  className={cn(
                    "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive('/gdyup/dashboard')
                      ? "bg-gray-800"
                      : "text-gray-100 hover:bg-gray-800 hover:text-white"
                  )}
                  style={isActive('/gdyup/dashboard') ? { color: primaryColor } : {}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart4 className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  href="/"
                  className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-100 hover:bg-gray-800 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Back to JetStream</span>
                </Link>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-900/30"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignIn();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-100 hover:bg-gray-800 hover:text-white"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignUp();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium bg-opacity-90"
                  style={{ backgroundColor: primaryColor, color: 'black' }}
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Sign Up</span>
                </button>
              </>
            )}
            
            <div className="h-px bg-gray-700 my-2" />
          </nav>
        )}
      </div>
    </header>
  );
} 