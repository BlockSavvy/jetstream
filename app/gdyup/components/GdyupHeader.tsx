'use client';

import { useEffect, useState, MouseEvent as ReactMouseEvent } from 'react';
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
  Plane,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-provider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import '../components/gdyup-forms.css'; // Import centralized CSS
import GdyupThemeSwitcher from './GdyupThemeSwitcher';

export default function GdyupHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

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
        icon: (active: boolean) => 
          <Search 
            className={`h-5 w-5 ${active ? 'nav-active-icon' : 'nav-icon'}`}
            style={{
              color: active ? 'var(--gdyup-nav-active-text)' : 'white',
              stroke: active ? 'var(--gdyup-nav-active-text)' : 'white',
              fill: 'none',
              strokeWidth: 2.5
            }}
          />,
        protected: false
      }
    ];
    
    // Items that require authentication
    const authItems = isAuthenticated ? [
      {
        name: 'Offer a Share',
        path: '/gdyup/offer',
        icon: (active: boolean) => 
          <PlaneTakeoff 
            className={`h-5 w-5 ${active ? 'nav-active-icon' : 'nav-icon'}`}
            style={{
              color: active ? 'var(--gdyup-nav-active-text)' : 'white',
              stroke: active ? 'var(--gdyup-nav-active-text)' : 'white',
              fill: 'none',
              strokeWidth: 2.5
            }}
          />,
        protected: true
      },
      {
        name: 'My Jets',
        path: '/gdyup/jets',
        icon: (active: boolean) => 
          <Plane 
            className={`h-5 w-5 ${active ? 'nav-active-icon' : 'nav-icon'}`}
            style={{
              color: active ? 'var(--gdyup-nav-active-text)' : 'white',
              stroke: active ? 'var(--gdyup-nav-active-text)' : 'white',
              fill: 'none',
              strokeWidth: 2.5
            }}
          />,
        protected: true
      }
    ] : [];
    
    return [...publicItems, ...authItems];
  };

  const menuItems = getMenuItems();

  const handleSignOut = async (e: ReactMouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
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
  
  const handleSignIn = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Use direct window location for more reliable navigation on iOS
    window.location.href = '/gdyup/auth/login';
  };
  
  const handleSignUp = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Use direct window location for more reliable navigation on iOS
    window.location.href = '/gdyup/auth/signup';
  };
  
  // Handle navigation to protected routes
  const handleProtectedNavigation = (path: string, e: ReactMouseEvent<HTMLButtonElement>) => {
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
  const handleLinkClick = (e: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.href = href;
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      // Close profile menu if clicked outside
      if (profileMenuOpen) {
        const profileMenu = document.getElementById('profile-menu');
        if (profileMenu && !profileMenu.contains(e.target as Node)) {
          setProfileMenuOpen(false);
        }
      }
      
      // Close theme menu if clicked outside
      if (themeMenuOpen) {
        const themeMenu = document.getElementById('theme-menu');
        if (themeMenu && !themeMenu.contains(e.target as Node)) {
          setThemeMenuOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, themeMenuOpen]);

  // Close menu if route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-[var(--gdyup-background)] border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo - completely redesigned to prevent hover effects */}
          <div className="relative">
            <style jsx global>{`
              /* Comprehensive logo hover prevention styles */
              header a img[src*="gdyup-logo"],
              header a img[alt*="GDYUP"],
              header .logo-container a,
              header .logo-container a:hover,
              header .logo-container a:focus,
              header .logo-container a:active {
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
                background: none !important;
                filter: none !important;
                text-shadow: none !important;
                text-decoration: none !important;
                opacity: 1 !important;
                transform: none !important;
              }
            `}</style>
            <div className="logo-container">
              <a 
                href="/gdyup" 
                onClick={(e) => handleLinkClick(e, '/gdyup')}
                style={{
                  display: 'block',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  margin: 0
                }}
              >
                <Image 
                  src="/assets/gdyup-logo.svg"
                  alt="GDYUP Logo"
                  width={150}
                  height={40}
                  className="h-10 w-auto gdyup-logo"
                  unoptimized={true}
                  priority={true}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    boxShadow: 'none',
                    filter: 'none',
                    outline: 'none'
                  }}
                />
              </a>
            </div>
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
                      ? "bg-[var(--gdyup-primary)] text-black"
                      : "text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
                  )}
                >
                  {item.icon(isActive(item.path))}
                  <span>{item.name}</span>
                </button>
              );
            })}
            
            {/* Theme Switcher visible in header */}
            <div className="flex items-center justify-center px-2 relative">
              <button 
                className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-[var(--gdyup-hover-bg)] transition-colors theme-menu-button"
                title="Change theme"
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              >
                <Palette 
                  className="h-5 w-5 palette-icon" 
                  style={{ 
                    color: 'var(--gdyup-primary)', 
                    stroke: 'var(--gdyup-primary)',
                    fill: 'none',
                    strokeWidth: 2.5
                  }} 
                />
              </button>
              
              {themeMenuOpen && (
                <div 
                  id="theme-menu"
                  className="absolute right-0 top-10 w-64 origin-top-right bg-[var(--gdyup-card-bg)] rounded-md shadow-lg ring-1 ring-[var(--gdyup-primary)]/20 border border-gray-700 z-50"
                >
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <Palette 
                        className="h-5 w-5 text-[var(--gdyup-primary)] mr-2" 
                        style={{ 
                          color: 'var(--gdyup-primary)', 
                          stroke: 'var(--gdyup-primary)',
                          fill: 'none',
                          strokeWidth: 2.5
                        }} 
                      />
                      <span className="font-medium text-white">Choose Theme</span>
                    </div>
                    <div className="flex justify-center mt-3 pb-1">
                      <GdyupThemeSwitcher />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Authentication Buttons for Desktop */}
            <div className="h-5 w-px bg-gray-700 mx-1" />
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setProfileMenuOpen(!profileMenuOpen);
                  }}
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium transition-colors",
                    isActive('/gdyup/profile')
                      ? "text-[var(--gdyup-primary)]"
                      : "text-white hover:text-[var(--gdyup-primary)]"
                  )}
                >
                  <User 
                    className={isActive('/gdyup/profile') ? "h-5 w-5 text-black" : "h-5 w-5 text-white"} 
                    style={{
                      color: isActive('/gdyup/profile') ? 'var(--gdyup-primary)' : 'white',
                      stroke: isActive('/gdyup/profile') ? 'var(--gdyup-primary)' : 'white',
                      fill: 'none',
                      strokeWidth: 2.5
                    }}
                  />
                  <span>{user?.email?.split('@')[0] || 'Profile'}</span>
                </button>
                
                {profileMenuOpen && (
                  <div 
                    id="profile-menu"
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-[var(--gdyup-card-bg)] rounded-md shadow-lg ring-1 ring-[var(--gdyup-primary)]/20 border border-gray-700 z-50 profile-menu"
                  >
                    <div className="py-1">
                      <a 
                        href="/gdyup/profile" 
                        className="flex px-4 py-2 text-sm text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          window.location.href = '/gdyup/profile';
                        }}
                      >
                        <User 
                          className="h-5 w-5 mr-2 text-white" 
                          style={{
                            color: 'white',
                            stroke: 'white',
                            fill: 'none',
                            strokeWidth: 2.5
                          }}
                        />
                        <span>Edit Profile</span>
                      </a>
                      
                      <a 
                        href="/gdyup/dashboard" 
                        className="flex px-4 py-2 text-sm text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          window.location.href = '/gdyup/dashboard';
                        }}
                      >
                        <BarChart4 
                          className="h-5 w-5 mr-2 text-white" 
                          style={{
                            color: 'white',
                            stroke: 'white',
                            fill: 'none',
                            strokeWidth: 2.5
                          }}
                        />
                        <span>Dashboard</span>
                      </a>
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setProfileMenuOpen(false);
                          handleSignOut(e);
                        }}
                        className="flex w-full px-4 py-2 text-sm text-[var(--gdyup-secondary)] hover:bg-red-900/30 hover:text-red-400"
                      >
                        <LogOut 
                          className="h-5 w-5 mr-2 text-[var(--gdyup-secondary)]" 
                          style={{
                            color: '#FF4B47',
                            stroke: '#FF4B47',
                            fill: 'none',
                            strokeWidth: 2.5
                          }}
                        />
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
                  className="text-white hover:text-[var(--gdyup-primary)] hover:bg-[var(--gdyup-hover-bg)]"
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
              className="rounded-md p-2 text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)] gdyup-header-menu"
              onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" style={{ color: 'white !important', stroke: 'white !important', fill: 'none', strokeWidth: 2.5 }} />
              ) : (
                <Menu className="h-6 w-6 text-white" style={{ color: 'white !important', stroke: 'white !important', fill: 'none', strokeWidth: 2.5 }} />
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
                      ? "bg-[var(--gdyup-primary)] text-black"
                      : "text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
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
                      ? "bg-[var(--gdyup-primary)] text-black"
                      : "text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/profile';
                  }}
                >
                  {isActive('/gdyup/profile') ? 
                    <User 
                      className="h-5 w-5 text-black" 
                      style={{
                        color: 'var(--gdyup-nav-active-text)',
                        stroke: 'var(--gdyup-nav-active-text)',
                        fill: 'none',
                        strokeWidth: 2.5
                      }}
                    /> : 
                    <User 
                      className="h-5 w-5 text-white" 
                      style={{
                        color: 'white',
                        stroke: 'white',
                        fill: 'none',
                        strokeWidth: 2.5
                      }}
                    />
                  }
                  <span>Profile</span>
                </a>
                
                <a
                  href="/gdyup/dashboard"
                  className={cn(
                    "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive('/gdyup/dashboard')
                      ? "bg-[var(--gdyup-primary)] text-black"
                      : "text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/dashboard';
                  }}
                >
                  {isActive('/gdyup/dashboard') ? 
                    <BarChart4 
                      className="h-5 w-5 text-black" 
                      style={{
                        color: 'var(--gdyup-nav-active-text)',
                        stroke: 'var(--gdyup-nav-active-text)',
                        fill: 'none',
                        strokeWidth: 2.5
                      }}
                    /> : 
                    <BarChart4 
                      className="h-5 w-5 text-white" 
                      style={{
                        color: 'white',
                        stroke: 'white',
                        fill: 'none',
                        strokeWidth: 2.5
                      }}
                    />
                  }
                  <span>Dashboard</span>
                </a>
                
                {/* Add Theme Switcher to mobile menu */}
                <div className="px-3 py-3 text-sm border border-[var(--gdyup-border)] rounded-md bg-[var(--gdyup-card-bg)]/50 mx-1 mt-3 mb-2">
                  <div className="flex items-center mb-3">
                    <Palette 
                      className="h-5 w-5 mr-2" 
                      style={{ 
                        color: 'var(--gdyup-primary)', 
                        stroke: 'var(--gdyup-primary)',
                        fill: 'none',
                        strokeWidth: 2.5
                      }} 
                    />
                    <span className="font-medium text-[var(--gdyup-text)]">Choose Theme</span>
                  </div>
                  <div className="flex justify-center">
                    <GdyupThemeSwitcher />
                  </div>
                </div>
                
                <button
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    handleSignOut(e);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-[var(--gdyup-secondary)]"
                >
                  <LogOut 
                    className="h-5 w-5 text-[var(--gdyup-secondary)]" 
                    style={{
                      color: '#FF4B47',
                      stroke: '#FF4B47',
                      fill: 'none',
                      strokeWidth: 2.5
                    }}
                  />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.location.href = '/gdyup/auth/login';
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-[var(--gdyup-hover-bg)] hover:text-[var(--gdyup-primary)]"
                >
                  <LogIn className="h-5 w-5 text-white" />
                  <span>Sign In</span>
                </button>
                
                <button
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
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