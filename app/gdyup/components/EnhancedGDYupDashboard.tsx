'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardContent } from '@/components/ui/card';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  MessageSquare, 
  Ticket, 
  Wallet, 
  Clock, 
  User, 
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemedIcon } from './core/ThemedIcon';
import { DashboardWrapper, DashboardCard, DashboardHeader, DashboardText } from './dashboard';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetHeader } from '@/components/ui/sheet';

// Dashboard tabs
import MyBookingsTab from './dashboard/MyBookingsTab';
import MyListingsTab from './dashboard/MyListingsTab';
import BoardingPassesTab from './dashboard/BoardingPassesTab';
import FlightChatsTab from './dashboard/FlightChatsTab';
import WalletIdentityTab from './dashboard/WalletIdentityTab';
import ActivityFeedTab from './dashboard/ActivityFeedTab';

// Navigation options with icons
const navigationOptions = [
  { id: 'bookings', label: 'Bookings', icon: Plane },
  { id: 'listings', label: 'Listings', icon: Plane, iconClass: 'rotate-45' },
  { id: 'passes', label: 'Passes', icon: Ticket },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'activity', label: 'Activity', icon: Clock },
];

// Component wrapper with error boundary functionality
interface TabErrorBoundaryProps {
  children: React.ReactNode;
  activeTab: string;
}

const TabErrorBoundary: React.FC<TabErrorBoundaryProps> = ({ children, activeTab }) => {
  const [hasError, setHasError] = useState(false);
  const { getThemedTextClasses, getThemedButtonClasses } = useGdyupTheme();
  
  // Reset error state when tab changes
  useEffect(() => {
    setHasError(false);
  }, [activeTab]);
  
  if (hasError) {
    return (
      <DashboardCard className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-900/20 text-red-500">
            <ThemedIcon icon={AlertCircle} size={24} />
          </div>
        </div>
        <DashboardText className="text-xl font-semibold mb-2">Something went wrong</DashboardText>
        <DashboardText className="text-gdyup-text-medium mb-6">
          We encountered an error loading this tab content.
        </DashboardText>
        <Button 
          onClick={() => setHasError(false)} 
          className={getThemedButtonClasses('primary')}
        >
          Try Again
        </Button>
      </DashboardCard>
    );
  }
  
  // This will catch any errors in the children and prevent them from crashing the app
  try {
    return children;
  } catch (error) {
    console.error("Error rendering tab content:", error);
    setHasError(true);
    return null;
  }
};

export default function EnhancedGDYupDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check if the user has completed onboarding
        const checkOnboarding = async () => {
          try {
            const response = await fetch(`/api/gdyup/profile?userId=${user.id}`);
            if (response.ok) {
              const responseData = await response.json();
              // Check if data exists and has the expected structure
              if (responseData && responseData.data && responseData.data.onboarding_completed === false) {
                router.push('/gdyup/onboarding');
              }
              // If onboarding_completed is undefined or true, or data structure is different, we continue normally
            } else {
              console.warn('Profile API returned non-OK status:', response.status);
              // Continue with the dashboard even if we couldn't check onboarding status
            }
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Continue with the dashboard even if there was an error
          }
        };
        
        checkOnboarding();
      } else {
        // If user is not loaded but not loading, we might have an auth issue
        console.log('User not authenticated or session expired, redirecting to login');
        router.push('/gdyup/auth/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={cn("py-12 flex justify-center", getThemedTextClasses())}>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-700 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardWrapper className="container mx-auto px-4 py-4 sm:py-6">
      <div className="header-container mb-4">
        {/* Mobile drawer trigger with section name */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden flex items-center justify-center"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5 text-gdyup-text" />
                </Button>
              </SheetTrigger>
              <h2 className={cn("text-xl font-semibold", getThemedTextClasses())}>
                {navigationOptions.find(opt => opt.id === activeTab)?.label}
              </h2>
            </div>
            
            {/* Desktop navigation tabs - only visible on larger screens */}
            <div className="hidden md:flex space-x-1">
              {navigationOptions.map(option => (
                <Button
                  key={option.id}
                  variant={activeTab === option.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(option.id)}
                  className={cn(
                    "flex items-center space-x-2",
                    activeTab === option.id ? 
                      "bg-gdyup-primary text-gdyup-button-text" : 
                      "text-gdyup-text hover:bg-gdyup-bg-dark"
                  )}
                >
                  <ThemedIcon 
                    icon={option.icon} 
                    className={cn(
                      "h-4 w-4", 
                      option.iconClass,
                      activeTab === option.id ? 
                        "text-black" : 
                        "text-gdyup-text"
                    )} 
                  />
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <SheetContent side="left" className="dashboard-nav-drawer">
            <div className="flex flex-col h-full py-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-gdyup-text">Navigation</SheetTitle>
              </SheetHeader>
              
              <nav className="space-y-1 flex-1">
                {navigationOptions.map(option => (
                  <SheetClose key={option.id} asChild>
                    <button 
                      onClick={() => setActiveTab(option.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                        activeTab === option.id ? 
                          "bg-gdyup-primary text-gdyup-button-text" : 
                          "text-gdyup-text hover:bg-gdyup-bg-dark/80"
                      )}
                    >
                      <ThemedIcon 
                        icon={option.icon} 
                        className={cn(
                          "h-5 w-5", 
                          option.iconClass,
                          activeTab === option.id ? 
                            "text-black" : 
                            "text-gdyup-text/80"
                        )} 
                      />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  </SheetClose>
                ))}
              </nav>
              
              <div className="mt-auto pt-6 border-t border-gdyup-border">
                <div className="px-4 py-2 text-sm text-gdyup-text-subtle">
                  {user?.email}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'bookings' && (
              <TabErrorBoundary activeTab={activeTab}>
                <MyBookingsTab />
              </TabErrorBoundary>
            )}
            
            {activeTab === 'listings' && (
              <TabErrorBoundary activeTab={activeTab}>
                <MyListingsTab />
              </TabErrorBoundary>
            )}
            
            {activeTab === 'passes' && (
              <TabErrorBoundary activeTab={activeTab}>
                <BoardingPassesTab />
              </TabErrorBoundary>
            )}
            
            {activeTab === 'chats' && (
              <TabErrorBoundary activeTab={activeTab}>
                <FlightChatsTab />
              </TabErrorBoundary>
            )}
            
            {activeTab === 'wallet' && (
              <TabErrorBoundary activeTab={activeTab}>
                <WalletIdentityTab />
              </TabErrorBoundary>
            )}
            
            {activeTab === 'activity' && (
              <TabErrorBoundary activeTab={activeTab}>
                <ActivityFeedTab />
              </TabErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardWrapper>
  );
} 