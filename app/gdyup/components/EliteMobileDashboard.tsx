'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Plane, 
  MessageSquare, 
  Ticket, 
  Clock, 
  ArrowRight,
  Bitcoin,
  CreditCard,
  Radio,
  CheckCircle2,
  Plus,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemedIcon } from './core/ThemedIcon';
import WalletIdentityTab from './dashboard/WalletIdentityTab';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  badge?: string;
}

export default function EliteMobileDashboard() {
  const [activeSection, setActiveSection] = useState<'overview' | 'wallet' | 'bookings' | 'listings'>('overview');
  const [mounted, setMounted] = useState(false);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gdyup-bg-dark rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gdyup-bg-dark rounded-lg"></div>
          <div className="h-24 bg-gdyup-bg-dark rounded-lg"></div>
        </div>
      </div>
    );
  }

  const quickActions: QuickAction[] = [
    {
      id: 'wallet-setup',
      title: 'Setup Wallet',
      description: 'Configure Bitcoin & payment methods',
      icon: Wallet,
      color: 'text-amber-500',
      action: () => setActiveSection('wallet'),
      badge: 'Priority'
    },
    {
      id: 'list-flight',
      title: 'List Seats',
      description: 'Share empty seats & recover costs',
      icon: Plane,
      color: 'text-blue-500',
      action: () => router.push('/gdyup/list')
    },
    {
      id: 'browse-flights',
      title: 'Browse Flights',
      description: 'Find available private jet seats',
      icon: Plus,
      color: 'text-green-500',
      action: () => router.push('/gdyup/browse')
    },
    {
      id: 'messages',
      title: 'Flight Chats',
      description: 'Communicate with passengers',
      icon: MessageSquare,
      color: 'text-purple-500',
      action: () => {} // Will implement flight chats
    }
  ];

  if (activeSection === 'wallet') {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setActiveSection('overview')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to Dashboard
        </Button>
        
        {/* Elite Wallet Section */}
        <WalletIdentityTab />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Elite Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gdyup-primary/20 via-gdyup-bg-dark to-black border border-gdyup-border"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gdyup-primary/5 to-transparent"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={cn("text-2xl font-bold", getThemedTextClasses())}>
                Welcome back!
              </h1>
              <p className={cn("text-sm opacity-80", getThemedTextClasses('muted'))}>
                {user?.email}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gdyup-primary/20">
              <Activity className="h-6 w-6 text-gdyup-primary" />
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={cn("text-xl font-bold", getThemedTextClasses())}>0</div>
              <div className={cn("text-xs", getThemedTextClasses('muted'))}>Active Listings</div>
            </div>
            <div className="text-center">
              <div className={cn("text-xl font-bold", getThemedTextClasses())}>0</div>
              <div className={cn("text-xs", getThemedTextClasses('muted'))}>Bookings</div>
            </div>
            <div className="text-center">
              <div className={cn("text-xl font-bold text-gdyup-primary")}>$0</div>
              <div className={cn("text-xs", getThemedTextClasses('muted'))}>Earned</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Elite Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className={cn("text-lg font-semibold", getThemedTextClasses())}>
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "border-gdyup-border bg-gdyup-bg-dark/50 backdrop-blur-sm hover:bg-gdyup-bg-dark/80 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]",
                  action.id === 'wallet-setup' && "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent"
                )}
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        action.id === 'wallet-setup' ? "bg-amber-500/20" : "bg-gdyup-bg-dark"
                      )}>
                        <ThemedIcon 
                          icon={action.icon} 
                          className={cn("h-5 w-5", action.color)} 
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={cn("font-semibold", getThemedTextClasses())}>
                            {action.title}
                          </h3>
                          {action.badge && (
                            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-500 rounded-full">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={cn("h-5 w-5", getThemedTextClasses('muted'))} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Elite Payment Methods Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-gdyup-border bg-gdyup-bg-dark/50">
          <CardHeader>
            <CardTitle className={cn("text-lg flex items-center gap-2", getThemedTextClasses())}>
              <Wallet className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Credit Card Status */}
            <div className="flex items-center justify-between p-3 bg-gdyup-bg-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <div>
                  <div className={getThemedTextClasses()}>Credit Cards</div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>Stripe enabled</div>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>

            {/* Bitcoin Status */}
            <div className="flex items-center justify-between p-3 bg-gdyup-bg-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bitcoin className="h-5 w-5 text-amber-500" />
                <div>
                  <div className={getThemedTextClasses()}>Bitcoin</div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>Setup required</div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveSection('wallet')}
                className={getThemedButtonClasses('primary')}
              >
                Setup
              </Button>
            </div>

            {/* Nostr Status */}
            <div className="flex items-center justify-between p-3 bg-gdyup-bg-dark/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-purple-500" />
                <div>
                  <div className={getThemedTextClasses()}>Nostr Identity</div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>Decentralized ID</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('wallet')}
                className="border-gdyup-border"
              >
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-gdyup-border bg-gdyup-bg-dark/50">
          <CardHeader>
            <CardTitle className={cn("text-lg flex items-center gap-2", getThemedTextClasses())}>
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className={cn("h-12 w-12 mx-auto mb-4 opacity-50", getThemedTextClasses('muted'))} />
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                No recent activity. Start by listing your first flight!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 