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
  Palette,
  Bug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-provider';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import '../components/gdyup-forms.css'; // Import centralized CSS
import GdyupThemeSwitcher from './GdyupThemeSwitcher';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { ThemedIcon } from './core';
import { ThemeDebugger } from '../utils/theme-debug';

export default function GdyupHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [showThemeDebugger, setShowThemeDebugger] = useState(false);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();

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
          active ? (
            <ThemedIcon icon={Search} className="text-gdyup-button-text" />
          ) : (
            <ThemedIcon icon={Search} />
          ),
        protected: false
      }
    ];
    
    // Items that require authentication
    const authItems = isAuthenticated ? [
      {
        name: 'Offer a Share',
        path: '/gdyup/offer',
        icon: (active: boolean) => 
          active ? (
            <ThemedIcon icon={PlaneTakeoff} className="text-gdyup-button-text" />
          ) : (
            <ThemedIcon icon={PlaneTakeoff} />
          ),
        protected: true
      },
      {
        name: 'My Jets',
        path: '/gdyup/jets',
        icon: (active: boolean) => 
          active ? (
            <ThemedIcon icon={Plane} className="text-gdyup-button-text" />
          ) : (
            <ThemedIcon icon={Plane} />
          ),
        protected: true
      }
    ] : [];
    
    return [...publicItems, ...authItems];
  };

  const menuItems = getMenuItems();

  // Toggle theme debugger
  const toggleThemeDebugger = () => {
    setShowThemeDebugger(!showThemeDebugger);
  };

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
    <>
      <header className="sticky top-0 z-50 border-b border-gdyup-border" style={{ 
        backgroundColor: 'var(--gdyup-bg-dark)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo - completely redesigned to prevent hover effects */}
            <div className="relative">
              <div className="gdyup-logo-container">
                <a 
                  href="/gdyup" 
                  onClick={(e) => handleLinkClick(e, '/gdyup')}
                >
                  <Image 
                    src="/assets/gdyup-logo.svg"
                    alt="GDYUP Logo"
                    width={150}
                    height={40}
                    className="h-10 w-auto gdyup-logo gdyup-logo-image"
                    unoptimized={true}
                    priority={true}
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
                        ? "bg-gdyup-primary text-gdyup-button-text"
                        : "text-gdyup-text hover:bg-gdyup-bg-hover hover:text-gdyup-primary"
                    )}
                  >
                    {/* Force icon to match text color for active state */}
                    {isActive(item.path) ? (
                      <ThemedIcon 
                        icon={item.icon(true).props.icon} 
                        className="text-gdyup-button-text" 
                        size={20} 
                      />
                    ) : (
                      item.icon(false)
                    )}
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              {/* Theme Switcher visible in header */}
              <div className="flex items-center justify-center px-2 relative">
                <GdyupThemeSwitcher showLabels={false} alignDropdown="end" sideOffset={8} />
              </div>
              
              {/* Theme Debug Button */}
              <button
                onClick={toggleThemeDebugger}
                className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-md text-sm",
                  showThemeDebugger ? "bg-red-600 text-white" : "text-red-500"
                )}
              >
                <Bug size={16} className="mr-1" />
                <span className="text-xs">Debug</span>
              </button>
              
              {/* Authentication Buttons for Desktop */}
              <div className="h-5 w-px bg-gdyup-border mx-1" />
              
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
                        ? getThemedTextClasses('primary')
                        : "text-gdyup-text hover:text-gdyup-primary"
                    )}
                  >
                    <ThemedIcon 
                      icon={User} 
                      className={isActive('/gdyup/profile') ? "text-gdyup-button-text" : ""} 
                    />
                    <span>{user?.email?.split('@')[0] || 'Profile'}</span>
                  </button>
                  
                  {profileMenuOpen && (
                    <div 
                      id="profile-menu"
                      className={cn(
                        getThemedBackgroundClasses('card'),
                        "absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg ring-1 ring-gdyup-primary/20 border border-gdyup-border z-50 profile-menu"
                      )}
                    >
                      <div className="py-1">
                        <a 
                          href="/gdyup/profile" 
                          className={cn("flex px-4 py-2 text-sm", getThemedTextClasses(), "hover:bg-gdyup-bg-hover hover:text-gdyup-primary")}
                          onClick={(e) => {
                            e.preventDefault();
                            setProfileMenuOpen(false);
                            window.location.href = '/gdyup/profile';
                          }}
                        >
                          <ThemedIcon 
                            icon={User} 
                            className={isActive('/gdyup/profile') ? "text-gdyup-button-text" : ""} 
                          />
                          <span>Edit Profile</span>
                        </a>
                        
                        <a 
                          href="/gdyup/dashboard" 
                          className={cn("flex px-4 py-2 text-sm", getThemedTextClasses(), "hover:bg-gdyup-bg-hover hover:text-gdyup-primary")}
                          onClick={(e) => {
                            e.preventDefault();
                            setProfileMenuOpen(false);
                            window.location.href = '/gdyup/dashboard';
                          }}
                        >
                          <ThemedIcon 
                            icon={BarChart4} 
                            className={isActive('/gdyup/dashboard') ? "text-gdyup-button-text" : ""} 
                          />
                          <span>Dashboard</span>
                        </a>
                        
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setProfileMenuOpen(false);
                            handleSignOut(e);
                          }}
                          className={cn(
                            "flex w-full px-4 py-2 text-sm",
                            getThemedTextClasses('destructive'),
                            "hover:bg-red-900/30 hover:text-red-400"
                          )}
                        >
                          <ThemedIcon 
                            icon={LogOut} 
                            className="mr-2 text-red-500" 
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
                    className={cn(getThemedTextClasses(), "hover:text-gdyup-primary hover:bg-gdyup-bg-hover")}
                  >
                    <ThemedIcon icon={LogIn} className="mr-2" />
                    Sign In
                  </Button>
                  
                  <Button 
                    onClick={handleSignUp}
                    size="sm"
                    className={cn(getThemedButtonClasses('primary', 'sm'), "hover:brightness-110")}
                  >
                    <ThemedIcon icon={UserPlus} className="mr-2" />
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
                  className={cn(getThemedButtonClasses('primary', 'sm'), "hover:brightness-110")}
                >
                  <ThemedIcon icon={UserPlus} className="mr-2" />
                  Sign Up
                </Button>
              )}
              
              <button
                type="button"
                className={cn(
                  "rounded-md p-2 hover:bg-gdyup-bg-hover hover:text-gdyup-primary gdyup-header-menu",
                  "text-gdyup-text",
                  getThemedTextClasses()
                )}
                onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--gdyup-border, #2a2a2a)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {mobileMenuOpen ? (
                  <ThemedIcon icon={X} size={24} className="text-gdyup-text opacity-100" />
                ) : (
                  <ThemedIcon icon={Menu} size={24} className="text-gdyup-text opacity-100" />
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
                        ? "bg-gdyup-primary text-gdyup-button-text"
                        : cn(getThemedTextClasses(), "hover:bg-gdyup-bg-hover hover:text-gdyup-primary")
                    )}
                    style={{ 
                      color: isActive(item.path) ? 'var(--gdyup-button-text)' : 'var(--gdyup-text)',
                      // Force icon visibility in mobile menus
                      // @ts-ignore - CSS custom property
                      '--icon-color': isActive(item.path) ? 'var(--gdyup-button-text)' : 'var(--gdyup-text)'
                    }}
                  >
                    {/* Apply direct style to ensure icon visibility */}
                    <div style={{ 
                      color: isActive(item.path) ? 'var(--gdyup-button-text)' : 'var(--gdyup-text)',
                      display: 'flex', 
                      alignItems: 'center',
                      // Extra force for visibility in mobile menus
                      stroke: isActive(item.path) ? 'var(--gdyup-button-text)' : 'var(--gdyup-text)'
                    }}>
                    {/* Force icon to match text color for active state */}
                    {isActive(item.path) ? (
                      <ThemedIcon 
                        icon={item.icon(true).props.icon} 
                        className="text-gdyup-button-text" 
                        size={20} 
                      />
                    ) : (
                      item.icon(false)
                    )}
                    </div>
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              <div className="h-px bg-gdyup-border my-2" />
              
              {/* Mobile Authentication Options */}
              {isAuthenticated ? (
                <>
                  <a
                    href="/gdyup/profile"
                    className={cn(
                      "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      isActive('/gdyup/profile')
                        ? "bg-gdyup-primary text-gdyup-button-text"
                        : cn(getThemedTextClasses(), "hover:bg-gdyup-bg-hover hover:text-gdyup-primary")
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      window.location.href = '/gdyup/profile';
                    }}
                  >
                    <ThemedIcon 
                      icon={User} 
                      className={isActive('/gdyup/profile') ? "text-gdyup-button-text" : ""} 
                    />
                    <span>Profile</span>
                  </a>
                  
                  <a
                    href="/gdyup/dashboard"
                    className={cn(
                      "flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      isActive('/gdyup/dashboard')
                        ? "bg-gdyup-primary text-gdyup-button-text"
                        : cn(getThemedTextClasses(), "hover:bg-gdyup-bg-hover hover:text-gdyup-primary")
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      window.location.href = '/gdyup/dashboard';
                    }}
                  >
                    <ThemedIcon 
                      icon={BarChart4} 
                      className={isActive('/gdyup/dashboard') ? "text-gdyup-button-text" : ""} 
                    />
                    <span>Dashboard</span>
                  </a>
                  
                  {/* Theme options for mobile */}
                  <div className={cn(
                    "flex items-center px-3 py-2 rounded-md w-full",
                    getThemedTextClasses()
                  )}>
                    <ThemedIcon 
                      icon={Palette} 
                      className="mr-2 text-gdyup-primary" 
                      size={18}
                    />
                    <span className="mr-2">Theme</span>
                    <div className="ml-auto">
                      <GdyupThemeSwitcher showLabels={false} alignDropdown="start" sideOffset={16} />
                    </div>
                  </div>
                  
                  {/* Debug button for mobile - using the same toggle function as in desktop */}
                  <button
                    onClick={() => {
                      toggleThemeDebugger();
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      showThemeDebugger ? "bg-red-600 text-white" : cn("text-red-500", getThemedTextClasses())
                    )}
                  >
                    <Bug size={18} className="mr-2" />
                    <span>Debug Theme</span>
                  </button>
                  
                  <button
                    onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      handleSignOut(e);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      getThemedTextClasses('destructive')
                    )}
                  >
                    <ThemedIcon 
                      icon={LogOut} 
                      className="mr-2 text-red-500" 
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
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      getThemedTextClasses(), 
                      "hover:bg-gdyup-bg-hover hover:text-gdyup-primary"
                    )}
                  >
                    <ThemedIcon icon={LogIn} className="mr-2" />
                    <span>Sign In</span>
                  </button>
                  
                  <button
                    onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      window.location.href = '/gdyup/auth/signup';
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      getThemedButtonClasses('primary')
                    )}
                  >
                    <ThemedIcon icon={UserPlus} className="mr-2" />
                    <span>Sign Up</span>
                  </button>
                  
                  {/* Theme options for mobile */}
                  <div className={cn(
                    "flex items-center px-3 py-2 rounded-md w-full mt-2",
                    getThemedTextClasses()
                  )}>
                    <ThemedIcon 
                      icon={Palette} 
                      className="mr-2 text-gdyup-primary" 
                      size={18}
                    />
                    <span className="mr-2">Theme</span>
                    <div className="ml-auto">
                      <GdyupThemeSwitcher showLabels={false} alignDropdown="start" sideOffset={16} />
                    </div>
                  </div>
                  
                  {/* Debug button for mobile */}
                  <button
                    onClick={() => {
                      toggleThemeDebugger();
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                      showThemeDebugger ? "bg-red-600 text-white" : cn("text-red-500", getThemedTextClasses())
                    )}
                  >
                    <Bug size={18} className="mr-2" />
                    <span>Debug Theme</span>
                  </button>
                </>
              )}
              
              <div className="h-px bg-gdyup-border my-2" />
            </nav>
          )}
        </div>
      </header>
      
      {/* Render ThemeDebugger when enabled */}
      {showThemeDebugger && <ThemeDebugger />}
    </>
  );
} 