'use client';

import { useEffect, useState, MouseEvent } from 'react';
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
import '../components/gdyup-forms.css'; // Import centralized CSS

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
        icon: (active: boolean) => active ? <Search className="h-5 w-5 text-black" /> : <Search className="h-5 w-5 text-white" />,
        protected: false
      }
    ];
    
    // Items that require authentication
    const authItems = isAuthenticated ? [
      {
        name: 'Offer a Share',
        path: '/gdyup/offer',
        icon: (active: boolean) => active ? <PlaneTakeoff className="h-5 w-5 text-black" /> : <PlaneTakeoff className="h-5 w-5 text-white" />,
        protected: true
      },
      {
        name: 'My Jets',
        path: '/gdyup/jets',
        icon: (active: boolean) => active ? <Plane className="h-5 w-5 text-black" /> : <Plane className="h-5 w-5 text-white" />,
        protected: true
      }
    ] : [];
    
    // Debug item (development only)
    const devItems = process.env.NODE_ENV === 'development' ? [
      {
        name: 'Debug',
        path: '/gdyup/debug',
        icon: (active: boolean) => <span className="text-xs p-1 bg-amber-100 text-amber-800 rounded">DEV</span>,
        protected: true
      }
    ] : [];
    
    return [...publicItems, ...authItems, ...devItems];
  };

  const menuItems = getMenuItems();

  const handleSignOut = async (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await signOut();
      toast.success('Signed out successfully');
      // Use direct window location for more reliable navigation on iOS
      window.location.href = '/gdyup';
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Sign out failed');
    }
  };
  
  const handleSignIn = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Use direct window location for more reliable navigation on iOS
    window.location.href = '/gdyup/auth/login';
  };
  
  const handleSignUp = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Use direct window location for more reliable navigation on iOS
    window.location.href = '/gdyup/auth/signup';
  };
  
  // Handle navigation to protected routes
  const handleProtectedNavigation = (path: string, e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to continue');
      // Use direct window location for more reliable navigation on iOS
      window.location.href = `/gdyup/auth/login?returnUrl=${encodeURIComponent(path)}`;
      return;
    }
    
    // Use direct window location for more reliable navigation on iOS
    window.location.href = path;
  };

  // GDY UP brand colors
  const primaryColor = "#DAFF0D"; 
  const secondaryColor = "#FF4B47";

  // Handle direct link navigation with fallback
  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.href = href;
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800" style={{ "--primary-color": primaryColor, "--secondary-color": secondaryColor } as React.CSSProperties}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <a href="/gdyup" className="flex items-center" onClick={(e) => handleLinkClick(e, '/gdyup')}>
              <Image 
                src="/assets/gdyup-logo-v2.svg"
                alt="GDYUP Logo"
                width={150}
                height={40}
                className="h-10 w-auto object-contain gdyup-logo"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-6">
            {menuItems.map((item) => {
              // Handle both protected and non-protected routes with buttons
              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    // Use appropriate navigation handler based on protection status
                    if (item.protected) {
                      handleProtectedNavigation(item.path, e);
                    } else {
                      // For non-protected routes, use direct navigation
                      window.location.href = item.path;
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.path)
                      ? "bg-[#DAFF0D] text-black"
                      : "text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                  )}
                >
                  {item.icon(isActive(item.path))}
                  <span>{item.name}</span>
                </button>
              );
            })}
            
            {/* Authentication Buttons for Desktop */}
            <div className="h-5 w-px bg-gray-700 mx-1" />
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setProfileMenuOpen(!profileMenuOpen);
                  }}
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium transition-colors",
                    isActive('/gdyup/profile')
                      ? { color: primaryColor }
                      : "text-white hover:text-[#DAFF0D]"
                  )}
                  style={isActive('/gdyup/profile') ? { color: primaryColor } : {}}
                >
                  <User className={isActive('/gdyup/profile') ? "h-5 w-5 text-black" : "h-5 w-5 text-white"} />
                  <span>{user?.email?.split('@')[0] || 'Profile'}</span>
                </button>
                
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-900 rounded-md shadow-lg ring-1 ring-[#DAFF0D]/20 border border-gray-700 z-50 profile-menu">
                    <div className="py-1">
                      <a 
                        href="/gdyup/profile" 
                        className="flex px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          window.location.href = '/gdyup/profile';
                        }}
                      >
                        <User className="h-5 w-5 mr-2 text-white" />
                        <span>Edit Profile</span>
                      </a>
                      
                      <a 
                        href="/gdyup/dashboard" 
                        className="flex px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          window.location.href = '/gdyup/dashboard';
                        }}
                      >
                        <BarChart4 className="h-5 w-5 mr-2 text-white" />
                        <span>Dashboard</span>
                      </a>
                      
                      <a 
                        href="/" 
                        className="flex px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          window.location.href = '/';
                        }}
                      >
                        <ChevronLeft className="h-5 w-5 mr-2 text-white" />
                        <span>Back to JetStream</span>
                      </a>
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          handleSignOut(e);
                        }}
                        className="flex w-full px-4 py-2 text-sm text-[#FF4B47] hover:bg-red-900/30 hover:text-[#FF6B67]"
                      >
                        <LogOut className="h-5 w-5 mr-2 text-[#FF4B47]" />
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
                  className="text-white hover:text-[#DAFF0D] hover:bg-gray-800"
                >
                  <LogIn className="h-4 w-4 mr-2 text-white" />
                  Sign In
                </Button>
                
                <Button 
                  onClick={handleSignUp}
                  size="sm"
                  className="gdyup-button hover:brightness-110"
                >
                  <UserPlus className="h-4 w-4 mr-2 text-black" />
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
                className="gdyup-button hover:brightness-110"
              >
                <UserPlus className="h-4 w-4 mr-2 text-black" />
                Sign Up
              </Button>
            )}
            
            <button
              type="button"
              className="rounded-md p-2 text-white hover:bg-gray-800 hover:text-[#DAFF0D] gdyup-header-menu"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mt-4 space-y-2 md:hidden mobile-menu">
            {menuItems.map((item) => {
              // Use button for all navigation items in mobile view too
              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    // Use appropriate navigation handler based on protection status
                    if (item.protected) {
                      handleProtectedNavigation(item.path, e);
                    } else {
                      // For non-protected routes, use direct navigation
                      window.location.href = item.path;
                    }
                  }}
                  className={cn(
                    "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive(item.path)
                      ? "bg-[#DAFF0D] text-black"
                      : "text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                  )}
                >
                  {item.icon(isActive(item.path))}
                  <span>{item.name}</span>
                </button>
              );
            })}
            
            <div className="h-px bg-gray-700 my-2" />
            
            {/* Mobile Authentication Options */}
            {isAuthenticated ? (
              <>
                <a
                  href="/gdyup/profile"
                  className={cn(
                    "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive('/gdyup/profile')
                      ? "bg-[#DAFF0D] text-black"
                      : "text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/profile';
                  }}
                >
                  {isActive('/gdyup/profile') ? 
                    <User className="h-5 w-5 text-black" /> : 
                    <User className="h-5 w-5 text-white" />
                  }
                  <span>Profile</span>
                </a>
                
                <a
                  href="/gdyup/dashboard"
                  className={cn(
                    "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive('/gdyup/dashboard')
                      ? "bg-[#DAFF0D] text-black"
                      : "text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/dashboard';
                  }}
                >
                  {isActive('/gdyup/dashboard') ? 
                    <BarChart4 className="h-5 w-5 text-black" /> : 
                    <BarChart4 className="h-5 w-5 text-white" />
                  }
                  <span>Dashboard</span>
                </a>
                
                <a
                  href="/"
                  className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/';
                  }}
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                  <span>Back to JetStream</span>
                </a>
                
                <button
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    handleSignOut(e);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-[#FF4B47]"
                >
                  <LogOut className="h-5 w-5 text-white" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/auth/login';
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-800 hover:text-[#DAFF0D]"
                >
                  <LogIn className="h-5 w-5 text-white" />
                  <span>Sign In</span>
                </button>
                
                <button
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/auth/signup';
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium gdyup-button"
                >
                  <UserPlus className="h-5 w-5 text-black" />
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