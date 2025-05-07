'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, MessageSquare, Ticket, Wallet, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dashboard tabs
import MyBookingsTab from './dashboard/MyBookingsTab';
import MyListingsTab from './dashboard/MyListingsTab';
import BoardingPassesTab from './dashboard/BoardingPassesTab';
import FlightChatsTab from './dashboard/FlightChatsTab';
import WalletIdentityTab from './dashboard/WalletIdentityTab';
import ActivityFeedTab from './dashboard/ActivityFeedTab';

export default function EnhancedGDYupDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const { getThemeClasses } = useGdyupTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (!loading && user) {
      // Check if the user has completed onboarding
      const checkOnboarding = async () => {
        try {
          const response = await fetch(`/api/gdyup/profile?userId=${user.id}`);
          if (response.ok) {
            const { data } = await response.json();
            if (!data.onboarding_completed) {
              router.push('/gdyup/onboarding');
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      };
      
      checkOnboarding();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
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
    <div className="container mx-auto py-6">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-center mb-6">
          <TabsList className={cn(
            "grid grid-cols-3 md:grid-cols-6 w-full md:w-auto rounded-lg p-1",
            getThemeClasses({
              base: "",
              default: "bg-gray-900",
              blue: "bg-blue-950",
              pink: "bg-pink-950"
            })
          )}>
            <TabsTrigger 
              value="bookings" 
              className={cn(
                "flex flex-col gap-1 py-2 px-3 data-[state=active]:text-black",
                getThemeClasses({
                  base: "",
                  default: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  blue: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  pink: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black"
                })
              )}
            >
              <Plane className="h-4 w-4" />
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="listings" 
              className={cn(
                "flex flex-col gap-1 py-2 px-3",
                getThemeClasses({
                  base: "",
                  default: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  blue: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  pink: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black"
                })
              )}
            >
              <Plane className="h-4 w-4 rotate-45" />
              <span className="text-xs">Listings</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="passes" 
              className={cn(
                "flex flex-col gap-1 py-2 px-3",
                getThemeClasses({
                  base: "",
                  default: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  blue: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  pink: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black"
                })
              )}
            >
              <Ticket className="h-4 w-4" />
              <span className="text-xs">Passes</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="chats" 
              className={cn(
                "flex flex-col gap-1 py-2 px-3",
                getThemeClasses({
                  base: "",
                  default: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  blue: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  pink: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black"
                })
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Chats</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="wallet" 
              className={cn(
                "flex flex-col gap-1 py-2 px-3",
                getThemeClasses({
                  base: "",
                  default: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  blue: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  pink: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black"
                })
              )}
            >
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Wallet</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="activity" 
              className={cn(
                "flex flex-col gap-1 py-2 px-3",
                getThemeClasses({
                  base: "",
                  default: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  blue: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black",
                  pink: "data-[state=active]:bg-gdyup-primary data-[state=active]:text-black"
                })
              )}
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs">Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="bookings" className="mt-0">
              <MyBookingsTab />
            </TabsContent>
            
            <TabsContent value="listings" className="mt-0">
              <MyListingsTab />
            </TabsContent>
            
            <TabsContent value="passes" className="mt-0">
              <BoardingPassesTab />
            </TabsContent>
            
            <TabsContent value="chats" className="mt-0">
              <FlightChatsTab />
            </TabsContent>
            
            <TabsContent value="wallet" className="mt-0">
              <WalletIdentityTab />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0">
              <ActivityFeedTab />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
} 