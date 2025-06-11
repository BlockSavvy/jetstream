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
  Activity,
  LucideIcon,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemedIcon } from './core/ThemedIcon';
import WalletIdentityTab from './dashboard/WalletIdentityTab';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  action: () => void;
  badge?: string;
  gradient?: string;
}

interface DashboardStats {
  activeListings: number;
  totalBookings: number;
  totalEarned: number;
  flightHours: number;
  loading: boolean;
}

export default function EliteMobileDashboard() {
  const [activeSection, setActiveSection] = useState<'overview' | 'wallet' | 'bookings' | 'listings'>('overview');
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    totalBookings: 0,
    totalEarned: 0,
    flightHours: 0,
    loading: true
  });
  
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Load real dashboard data
    const loadDashboardData = async () => {
      try {
        if (user?.id) {
          // Simulate API call for now - replace with real API calls
          const response = await fetch(`/api/gdyup/dashboard?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setStats({
              activeListings: data.activeListings || 0,
              totalBookings: data.totalBookings || 0,
              totalEarned: data.totalEarned || 0,
              flightHours: data.flightHours || 0,
              loading: false
            });
          } else {
            // Fallback to default values if API fails
            setStats(prev => ({ ...prev, loading: false }));
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  if (loading || !mounted) {
    return (
      <div className="space-y-6">
        {/* Elite Loading Animation */}
        <motion.div 
          className="h-40 rounded-3xl bg-gradient-to-br from-gdyup-primary/5 via-gdyup-bg-dark to-black border border-gdyup-border/30"
          animate={{ 
            background: [
              "linear-gradient(45deg, rgba(218,255,13,0.05) 0%, rgba(0,0,0,1) 100%)",
              "linear-gradient(45deg, rgba(218,255,13,0.1) 0%, rgba(0,0,0,1) 100%)",
              "linear-gradient(45deg, rgba(218,255,13,0.05) 0%, rgba(0,0,0,1) 100%)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-gdyup-primary border-t-transparent rounded-full"
            />
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 bg-gdyup-bg-dark/50 rounded-2xl animate-pulse"></div>
          <div className="h-28 bg-gdyup-bg-dark/50 rounded-2xl animate-pulse"></div>
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
      color: 'text-amber-400',
      action: () => setActiveSection('wallet'),
      badge: 'Priority',
      gradient: 'from-amber-500/20 via-yellow-500/10 to-orange-500/5'
    },
    {
      id: 'list-flight',
      title: 'List Seats',
      description: 'Share empty seats & recover costs',
      icon: Plane,
      color: 'text-blue-400',
      action: () => router.push('/gdyup/list'),
      gradient: 'from-blue-500/20 via-indigo-500/10 to-purple-500/5'
    },
    {
      id: 'browse-flights',
      title: 'Browse Flights',
      description: 'Find available private jet seats',
      icon: Target,
      color: 'text-green-400',
      action: () => router.push('/gdyup/browse'),
      gradient: 'from-green-500/20 via-emerald-500/10 to-teal-500/5'
    },
    {
      id: 'messages',
      title: 'Flight Chats',
      description: 'Communicate with passengers',
      icon: MessageSquare,
      color: 'text-purple-400',
      action: () => {}, // Will implement flight chats
      gradient: 'from-purple-500/20 via-pink-500/10 to-rose-500/5'
    }
  ];

  if (activeSection === 'wallet') {
    return (
      <div className="space-y-4">
        {/* Elite Back Button */}
        <motion.button
          onClick={() => setActiveSection('overview')}
          className={cn(
            "mb-6 flex items-center gap-3 p-4 rounded-2xl",
            "bg-gradient-to-r from-gdyup-bg-card/50 to-gdyup-bg-card/30",
            "border border-gdyup-border/30 backdrop-blur-xl",
            "hover:border-gdyup-primary/50 transition-all duration-300",
            getThemedTextClasses()
          )}
          whileHover={{ scale: 1.02, x: -5 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowRight className="h-5 w-5 rotate-180 text-gdyup-primary" />
          <span className="font-semibold">Back to Dashboard</span>
        </motion.button>
        
        {/* Elite Wallet Section */}
        <WalletIdentityTab />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Elite Welcome Header with Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-gdyup-border/30",
          "bg-gradient-to-br from-gdyup-primary/10 via-gdyup-bg-dark/90 to-black",
          "backdrop-blur-2xl shadow-2xl"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gdyup-primary/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gdyup-primary/5 rounded-full blur-3xl"></div>
        
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.h1 
                className={cn("text-3xl font-bold mb-2", getThemedTextClasses())}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Welcome back!
              </motion.h1>
              <p className={cn("text-sm opacity-80", getThemedTextClasses('muted'))}>
                {user?.email}
              </p>
            </div>
            <motion.div 
              className="p-4 rounded-2xl bg-gdyup-primary/20 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Activity className="h-8 w-8 text-gdyup-primary" />
            </motion.div>
          </div>
          
          {/* Enhanced Stats with Real Data */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              className="text-center p-4 rounded-2xl bg-gdyup-bg-card/30 backdrop-blur-sm border border-gdyup-border/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={cn("text-2xl font-bold flex items-center justify-center gap-2", getThemedTextClasses())}>
                {stats.loading ? (
                  <div className="w-6 h-6 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {stats.activeListings}
                    <Star className="h-5 w-5 text-gdyup-primary" />
                  </>
                )}
              </div>
              <div className={cn("text-xs font-medium", getThemedTextClasses('muted'))}>Active Listings</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 rounded-2xl bg-gdyup-bg-card/30 backdrop-blur-sm border border-gdyup-border/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={cn("text-2xl font-bold flex items-center justify-center gap-2", getThemedTextClasses())}>
                {stats.loading ? (
                  <div className="w-6 h-6 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {stats.totalBookings}
                    <Ticket className="h-5 w-5 text-blue-400" />
                  </>
                )}
              </div>
              <div className={cn("text-xs font-medium", getThemedTextClasses('muted'))}>Bookings</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 rounded-2xl bg-gdyup-bg-card/30 backdrop-blur-sm border border-gdyup-border/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={cn("text-2xl font-bold text-gdyup-primary flex items-center justify-center gap-2")}>
                {stats.loading ? (
                  <div className="w-6 h-6 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    ${stats.totalEarned.toLocaleString()}
                    <TrendingUp className="h-5 w-5" />
                  </>
                )}
              </div>
              <div className={cn("text-xs font-medium", getThemedTextClasses('muted'))}>Earned</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 rounded-2xl bg-gdyup-bg-card/30 backdrop-blur-sm border border-gdyup-border/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={cn("text-2xl font-bold flex items-center justify-center gap-2", getThemedTextClasses())}>
                {stats.loading ? (
                  <div className="w-6 h-6 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {stats.flightHours}
                    <Zap className="h-5 w-5 text-amber-400" />
                  </>
                )}
              </div>
              <div className={cn("text-xs font-medium", getThemedTextClasses('muted'))}>Flight Hours</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Elite Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className={cn("text-xl font-bold", getThemedTextClasses())}>
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "border-2 border-gdyup-border/30 backdrop-blur-xl",
                  `bg-gradient-to-r ${action.gradient || 'from-gdyup-bg-card/50 to-gdyup-bg-card/30'}`,
                  "hover:border-gdyup-primary/50 hover:shadow-2xl hover:shadow-gdyup-primary/10",
                  "transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]",
                  action.id === 'wallet-setup' && "ring-2 ring-amber-500/30"
                )}
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className={cn(
                          "p-4 rounded-2xl shadow-lg",
                          action.id === 'wallet-setup' ? "bg-amber-500/20" : "bg-gdyup-bg-dark/50"
                        )}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <ThemedIcon 
                          icon={action.icon} 
                          className={cn("h-6 w-6", action.color)} 
                        />
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className={cn("text-lg font-bold", getThemedTextClasses())}>
                            {action.title}
                          </h3>
                          {action.badge && (
                            <motion.span 
                              className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30"
                              animate={{ 
                                boxShadow: [
                                  "0 0 0 0 rgba(245, 158, 11, 0.4)",
                                  "0 0 0 10px rgba(245, 158, 11, 0)",
                                ]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {action.badge}
                            </motion.span>
                          )}
                        </div>
                        <p className={cn("text-sm mt-1", getThemedTextClasses('muted'))}>
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ArrowRight className={cn("h-6 w-6", getThemedTextClasses('muted'))} />
                    </motion.div>
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
        <Card className="border-2 border-gdyup-border/30 bg-gradient-to-br from-gdyup-bg-card/50 to-gdyup-bg-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className={cn("text-xl font-bold flex items-center gap-3", getThemedTextClasses())}>
              <div className="p-2 rounded-xl bg-gdyup-primary/20">
                <Wallet className="h-6 w-6 text-gdyup-primary" />
              </div>
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Credit Card Status */}
            <motion.div 
              className="flex items-center justify-between p-4 bg-gdyup-bg-dark/30 rounded-2xl border border-gdyup-border/20"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <CreditCard className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className={cn("font-semibold", getThemedTextClasses())}>Credit Cards</div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>Stripe enabled</div>
                </div>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </motion.div>

            {/* Bitcoin Status */}
            <motion.div 
              className="flex items-center justify-between p-4 bg-gdyup-bg-dark/30 rounded-2xl border border-gdyup-border/20"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Bitcoin className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <div className={cn("font-semibold", getThemedTextClasses())}>Bitcoin</div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>Setup required</div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveSection('wallet')}
                className={cn(
                  "px-4 py-2 rounded-xl font-semibold",
                  "bg-gdyup-primary text-gdyup-button-text",
                  "hover:brightness-110 transition-all duration-200"
                )}
              >
                Setup
              </Button>
            </motion.div>

            {/* Nostr Status */}
            <motion.div 
              className="flex items-center justify-between p-4 bg-gdyup-bg-dark/30 rounded-2xl border border-gdyup-border/20"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Radio className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className={cn("font-semibold", getThemedTextClasses())}>Nostr Identity</div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>Decentralized ID</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('wallet')}
                className="border-2 border-gdyup-border/30 bg-gdyup-bg-card/30 hover:bg-gdyup-bg-card/50 rounded-xl"
              >
                Configure
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-2 border-gdyup-border/30 bg-gradient-to-br from-gdyup-bg-card/50 to-gdyup-bg-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className={cn("text-xl font-bold flex items-center gap-3", getThemedTextClasses())}>
              <div className="p-2 rounded-xl bg-gdyup-primary/20">
                <Clock className="h-6 w-6 text-gdyup-primary" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <motion.div
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-6 rounded-2xl bg-gdyup-primary/10 border border-gdyup-primary/20 inline-block mb-6"
              >
                <Clock className={cn("h-16 w-16 mx-auto text-gdyup-primary")} />
              </motion.div>
              <h3 className={cn("text-lg font-bold mb-2", getThemedTextClasses())}>
                Ready for Takeoff
              </h3>
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                No recent activity. Start by listing your first flight to connect with fellow jet travelers!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 