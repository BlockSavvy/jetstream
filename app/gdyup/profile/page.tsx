'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield, 
  LogOut, 
  Edit3, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Plane,
  Clock,
  Camera,
  Check,
  X,
  Zap,
  Key,
  Globe,
  Copy,
  QrCode,
  Wallet,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/lib/auth-provider';
import { useNostr } from '../contexts/NostrContext';
import { toast } from 'sonner';
import GdyupClientLayout from '../components/GdyupClientLayout';

export default function ProfilePage() {
  return (
    <GdyupClientLayout>
      <ProfilePageContent />
    </GdyupClientLayout>
  );
}

function ProfilePageContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'nostr'>('profile');
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    joinDate: '',
    flightHours: 0,
    totalFlights: 0,
    rating: 0,
    btcWalletAddress: '',
    lnurl: '',
    lightningWalletType: 'non-custodial' as 'custodial' | 'non-custodial'
  });
  const [tempData, setTempData] = useState(profileData);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getThemedTextClasses } = useGdyupTheme();
  const { user, signOut } = useAuth();
  const { 
    isConnected: nostrConnected, 
    pubkey, 
    nip05,
    connect: connectNostr,
    disconnect: disconnectNostr
  } = useNostr();

  // Load profile data
  useEffect(() => {
    if (user) {
      console.log('[Profile] 🚀 Loading elite user profile data');
      
      try {
        // Extract data from user object with enhanced data
        const userData = {
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Elite Pilot',
          email: user.email || '',
          phone: user.user_metadata?.phone || user.phone || '',
          location: user.user_metadata?.location || 'Global',
          bio: user.user_metadata?.bio || 'Passionate about aviation and luxury travel.',
          joinDate: new Date(user.created_at || Date.now()).toLocaleDateString(),
          flightHours: user.user_metadata?.flight_hours || 127,
          totalFlights: user.user_metadata?.total_flights || 23,
          rating: user.user_metadata?.rating || 4.9,
          btcWalletAddress: user.user_metadata?.btc_wallet_address || '',
          lnurl: user.user_metadata?.lnurl || '',
          lightningWalletType: user.user_metadata?.lightning_wallet_type || 'non-custodial'
        };
        
        setProfileData(userData);
        setTempData(userData);
        setLoading(false);
        
        console.log('[Profile] ✅ Profile data loaded successfully');
      } catch (error) {
        console.error('[Profile] 🚨 Error loading profile:', error);
        setError('Failed to load profile data');
        setLoading(false);
      }
    }
  }, [user]);

  // Handle profile update
  const handleSave = async () => {
    setUpdating(true);
    try {
      console.log('[Profile] 💾 Updating elite profile data...');
      
      // In a real app, this would call the API
      // For now, we'll just update the local state
      setProfileData(tempData);
      setIsEditing(false);
      
      toast.success('Profile updated successfully!');
      console.log('[Profile] ✅ Profile updated successfully');
    } catch (error) {
      console.error('[Profile] 🚨 Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger a re-load of profile data
    window.location.reload();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'nostr', label: 'Nostr', icon: MessageSquare }
  ];

  const menuItems = [
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Update your account preferences',
      action: () => toast.info('Settings coming soon!')
    },
    {
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Manage cards and payment options',
      action: () => setActiveTab('wallet')
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Control your notification preferences',
      action: () => toast.info('Notification settings coming soon!')
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Manage your privacy settings',
      action: () => toast.info('Privacy settings coming soon!')
    },
    {
      icon: Key,
      title: 'Nostr Identity',
      description: 'Manage your decentralized identity',
      action: () => setActiveTab('nostr')
    }
  ];

  const stats = [
    {
      icon: Clock,
      label: 'Flight Hours',
      value: profileData.flightHours,
      suffix: 'hrs',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      icon: Plane,
      label: 'Total Flights',
      value: profileData.totalFlights,
      suffix: '',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      icon: Star,
      label: 'Rating',
      value: profileData.rating,
      suffix: '/5',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ];

  return (
    <div className="min-h-screen gdyup-app bg-black text-white">
      {/* ELITE HEADER */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            
            {activeTab === 'profile' && !isEditing ? (
              <motion.button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit3 size={18} className="text-white" />
                <span className="text-white">Edit</span>
              </motion.button>
            ) : activeTab === 'profile' && isEditing ? (
              <div className="flex gap-2">
                <motion.button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={18} className="text-red-400" />
                  <span className="text-red-400">Cancel</span>
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/40 rounded-xl transition-all disabled:opacity-50"
                  whileHover={!updating ? { scale: 1.05 } : {}}
                  whileTap={!updating ? { scale: 0.95 } : {}}
                >
                  <Check size={18} className="text-green-400" />
                  <span className="text-green-400">{updating ? 'Saving...' : 'Save'}</span>
                </motion.button>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ERROR STATE */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Failed to load profile data</p>
                <p className="text-white/70 text-sm">{error}</p>
              </div>
              <motion.button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB NAVIGATION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 mb-8"
        >
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all flex-1 justify-center',
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                  whileHover={!isActive ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-white/70'} />
                  <span className={isActive ? 'text-white' : 'text-white/70'}>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* PROFILE HEADER */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
                {loading ? (
                  // Loading skeleton
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white/20 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="w-48 h-6 bg-white/20 rounded animate-pulse" />
                      <div className="w-32 h-4 bg-white/20 rounded animate-pulse" />
                      <div className="w-64 h-4 bg-white/20 rounded animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* Profile Picture */}
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        {profileData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      {isEditing && (
                        <motion.button
                          className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white border border-white/20"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Camera size={16} className="text-white" />
                        </motion.button>
                      )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4">
                      {/* Name */}
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempData.fullName}
                            onChange={(e) => setTempData(prev => ({ ...prev, fullName: e.target.value }))}
                            className="text-2xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none w-full"
                            placeholder="Full Name"
                          />
                        ) : (
                          <h2 className="text-2xl font-bold text-white">{profileData.fullName}</h2>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-white/80">
                          <Mail size={16} className="text-white/80" />
                          {isEditing ? (
                            <input
                              type="email"
                              value={tempData.email}
                              onChange={(e) => setTempData(prev => ({ ...prev, email: e.target.value }))}
                              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none flex-1"
                              placeholder="Email"
                            />
                          ) : (
                            <span className="text-white/80">{profileData.email}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-white/80">
                          <Phone size={16} className="text-white/80" />
                          {isEditing ? (
                            <input
                              type="tel"
                              value={tempData.phone}
                              onChange={(e) => setTempData(prev => ({ ...prev, phone: e.target.value }))}
                              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none flex-1"
                              placeholder="Phone"
                            />
                          ) : (
                            <span className="text-white/80">{profileData.phone || 'Not provided'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-white/80">
                          <MapPin size={16} className="text-white/80" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={tempData.location}
                              onChange={(e) => setTempData(prev => ({ ...prev, location: e.target.value }))}
                              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none flex-1"
                              placeholder="Location"
                            />
                          ) : (
                            <span className="text-white/80">{profileData.location || 'Not provided'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-white/80">
                          <Calendar size={16} className="text-white/80" />
                          <span className="text-white/80">Joined {profileData.joinDate}</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        {isEditing ? (
                          <textarea
                            value={tempData.bio}
                            onChange={(e) => setTempData(prev => ({ ...prev, bio: e.target.value }))}
                            className="w-full h-24 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none resize-none"
                            placeholder="Tell us about yourself..."
                          />
                        ) : (
                          <p className="text-white/80">{profileData.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center"
                    >
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', stat.bgColor)}>
                        <Icon className={cn('w-6 h-6', stat.color)} />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {stat.value}{stat.suffix}
                      </div>
                      <div className="text-white/60 text-sm">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* MENU ITEMS */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>
                
                <div className="space-y-3">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.title}
                        onClick={item.action}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 transition-all text-left"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{item.title}</div>
                          <div className="text-white/60 text-sm">{item.description}</div>
                        </div>
                        <div className="text-white/40">
                          <Settings size={16} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* SIGN OUT */}
              <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-6">
                <motion.button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-xl text-red-400 font-medium hover:bg-red-500/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut size={20} className="text-red-400" />
                  <span className="text-red-400">Sign Out</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Bitcoin Wallet</h3>
              
              {profileData.btcWalletAddress ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-2 block">BTC Wallet Address</label>
                      <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
                        <span className="font-mono text-sm text-white flex-1 truncate">
                          {profileData.btcWalletAddress}
                        </span>
                        <button
                          onClick={() => handleCopy(profileData.btcWalletAddress, 'BTC address')}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Copy size={16} className="text-white/80" />
                        </button>
                      </div>
                    </div>
                    
                    {profileData.lnurl && (
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">Lightning Address</label>
                        <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
                          <span className="text-sm text-white flex-1">
                            {profileData.lnurl}
                          </span>
                          <button
                            onClick={() => handleCopy(profileData.lnurl, 'Lightning address')}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Copy size={16} className="text-white/80" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <span className="text-white/80">Wallet Type</span>
                      <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                        {profileData.lightningWalletType === 'custodial' ? 'Custodial' : 'Self-Custodial'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet size={32} className="text-white/60" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No Wallet Connected</h4>
                  <p className="text-white/60 mb-6">Connect a Bitcoin wallet to enable payments and zaps</p>
                  <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors">
                    Connect Wallet
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'nostr' && (
            <motion.div
              key="nostr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Nostr Identity</h3>
              
              {pubkey ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-2 block">Public Key</label>
                      <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
                        <span className="font-mono text-sm text-white flex-1 truncate">
                          {pubkey}
                        </span>
                        <button
                          onClick={() => handleCopy(pubkey, 'Nostr pubkey')}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Copy size={16} className="text-white/80" />
                        </button>
                      </div>
                    </div>
                    
                    {nip05 && (
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">NIP-05 Identifier</label>
                        <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
                          <span className="text-sm text-white flex-1">
                            {nip05}
                          </span>
                          <button
                            onClick={() => handleCopy(nip05, 'NIP-05 identifier')}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Copy size={16} className="text-white/80" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <span className="text-white/80">Connection Status</span>
                      <div className={cn(
                        'px-3 py-1 rounded-lg text-sm font-medium',
                        nostrConnected 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      )}>
                        {nostrConnected ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={nostrConnected ? disconnectNostr : connectNostr}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl font-medium transition-colors',
                        nostrConnected 
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                          : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                      )}
                    >
                      {nostrConnected ? 'Disconnect' : 'Connect'}
                    </button>
                    <button
                      onClick={() => handleCopy(`nostr:${pubkey}`, 'Nostr URI')}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                      <QrCode size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} className="text-white/60" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No Nostr Identity</h4>
                  <p className="text-white/60 mb-6">Connect your Nostr pubkey to enable messaging and zaps</p>
                  <button 
                    onClick={connectNostr}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Connect Nostr Identity
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
