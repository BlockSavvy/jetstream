'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';
import { Container } from '@/app/gdyup/components/container';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Wallet, 
  MessageSquare, 
  QrCode, 
  Award,
  Copy,
  ExternalLink,
  Zap,
  Edit,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import NostrIdentityVerifier from '@/app/gdyup/components/NostrIdentityVerifier';
import NostrVerificationBadge from '@/app/gdyup/components/NostrVerificationBadge';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/hooks/useUserProfile';
import { ClientContentWrapper } from '../components/ClientContentWrapper';

// Extend the UserProfile type to include wallet properties
interface ExtendedUserProfile extends UserProfile {
  btcWalletAddress?: string;
  lnurl?: string;
  lightningWalletType?: 'custodial' | 'non-custodial';
  role?: string | null;
  affiliation?: string | null;
  theme?: string | null;
}

// Define interface for wallet component props
interface BTCWalletSectionProps {
  profile: ExtendedUserProfile | null;
  handleUpdate: (updates: Partial<ExtendedUserProfile>) => Promise<void>;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

// FullBTC wallet component
const BTCWalletSection = ({ 
  profile, 
  handleUpdate,
  isEditing,
  setIsEditing
}: BTCWalletSectionProps) => {
  const { getThemeClasses } = useGdyupTheme();
  const [walletValue, setWalletValue] = useState(profile?.btcWalletAddress || '');
  const [lnurlValue, setLnurlValue] = useState(profile?.lnurl || '');
  const [walletType, setWalletType] = useState(profile?.lightningWalletType || 'non-custodial');
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  
  const handleSave = async () => {
    await handleUpdate({
      btcWalletAddress: walletValue,
      lnurl: lnurlValue,
      lightningWalletType: walletType
    });
    setIsEditing(false);
    toast.success('Wallet information updated');
  };
  
  // Show wallet form if editing
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Bitcoin Wallet Address</label>
          <div className="flex">
            <input 
              type="text" 
              value={walletValue} 
              onChange={(e) => setWalletValue(e.target.value)}
              placeholder="Enter BTC wallet address" 
              className="flex-1 p-2 rounded-l-md bg-gray-800 border border-gray-700 text-white"
            />
            <Button 
              onClick={() => handleCopy(walletValue, 'Address')}
              className="rounded-l-none rounded-r-md bg-gray-700"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Lightning Address (LNURL)</label>
          <div className="flex">
            <input 
              type="text" 
              value={lnurlValue} 
              onChange={(e) => setLnurlValue(e.target.value)}
              placeholder="you@domain.com or lnurl..." 
              className="flex-1 p-2 rounded-l-md bg-gray-800 border border-gray-700 text-white"
            />
            <Button 
              onClick={() => handleCopy(lnurlValue, 'LNURL')}
              className="rounded-l-none rounded-r-md bg-gray-700"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Wallet Type</label>
          <div className="flex space-x-2">
            <Button 
              variant={walletType === 'non-custodial' ? 'default' : 'outline'} 
              onClick={() => setWalletType('non-custodial')}
              className="flex-1"
            >
              Self-Custodial
            </Button>
            <Button 
              variant={walletType === 'custodial' ? 'default' : 'outline'} 
              onClick={() => setWalletType('custodial')}
              className="flex-1"
            >
              Custodial
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    );
  }
  
  // View mode
  return (
    <div className="space-y-4">
      {profile?.btcWalletAddress ? (
        <>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-300">BTC Wallet</span>
              <div className="flex items-center">
                <span className="font-mono text-sm text-white truncate max-w-[200px]">
                  {profile.btcWalletAddress.slice(0, 10)}...{profile.btcWalletAddress.slice(-5)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(profile.btcWalletAddress || '', 'BTC address')}
                  className="ml-1 h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <Badge className={
              getThemeClasses({
                base: "",
                default: "bg-green-900 text-green-100",
                luxury: "bg-blue-900 text-blue-100",
                bitcoin: "bg-amber-900 text-amber-100",
              })
            }>
              {profile.lightningWalletType === 'custodial' ? 'Custodial' : 'Self-Custodial'}
            </Badge>
          </div>
          
          {profile.lnurl && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-300">Lightning Address</span>
              <div className="flex items-center">
                <span className="font-mono text-sm text-white">{profile.lnurl}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(profile.lnurl || '', 'Lightning address')}
                  className="ml-1 h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Wallet Settings
          </Button>
        </>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="rounded-full bg-gray-800 h-16 w-16 flex items-center justify-center mx-auto">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">No Wallet Connected</h3>
            <p className="text-sm text-gray-400 mt-1">
              Connect a Bitcoin wallet to enable payments and zaps
            </p>
          </div>
          <Button 
            className="mt-2" 
            onClick={() => setIsEditing(true)}
          >
            Connect Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

// Define interface for Nostr component props
interface NostrSectionProps {
  profile: ExtendedUserProfile | null;
  handleUpdate: (updates: Partial<ExtendedUserProfile>) => Promise<void>;
}

// Nostr Identity section
const NostrSection = ({ profile, handleUpdate }: NostrSectionProps) => {
  const { getThemeClasses } = useGdyupTheme();
  const { 
    isConnected, 
    isEnabled, 
    pubkey, 
    nip05,
    connect,
    disconnect
  } = useNostr();
  const [showVerifier, setShowVerifier] = useState(false);
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  
  const handleCompleteVerification = async () => {
    setShowVerifier(false);
    toast.success('Nostr identity verified successfully');
  };
  
  return (
    <div className="space-y-4">
      {showVerifier && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">Verify Nostr Identity</h2>
            <NostrIdentityVerifier onComplete={handleCompleteVerification} />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowVerifier(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {pubkey ? (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-300">Nostr Identity</span>
              <div className="flex items-center">
                <span className="font-mono text-sm text-white truncate max-w-[200px]">
                  {pubkey.slice(0, 10)}...{pubkey.slice(-5)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(pubkey, 'Nostr pubkey')}
                  className="ml-1 h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <NostrVerificationBadge 
              pubkey={pubkey}
              nip05={nip05}
              size="sm"
            />
          </div>
          
          {nip05 && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-300">NIP-05 Identifier</span>
              <div className="flex items-center">
                <span className="text-sm text-white">{nip05}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy(nip05, 'NIP-05 identifier')}
                  className="ml-1 h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              variant={isConnected ? "destructive" : "outline"}
              size="sm"
              onClick={isConnected ? disconnect : connect}
            >
              {isConnected ? 'Disconnect Relays' : 'Connect Relays'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVerifier(true)}
            >
              {nip05 ? 'Update NIP-05' : 'Verify NIP-05'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCopy(`nostr:${pubkey}`, 'Nostr URI')}
            >
              <QrCode className="h-3.5 w-3.5 mr-1" />
              Copy Nostr URI
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="rounded-full bg-gray-800 h-16 w-16 flex items-center justify-center mx-auto">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">No Nostr Identity</h3>
            <p className="text-sm text-gray-400 mt-1">
              Connect your Nostr pubkey to enable messaging and zaps
            </p>
          </div>
          <Button 
            className="mt-2" 
            onClick={() => setShowVerifier(true)}
          >
            Connect Nostr Identity
          </Button>
        </div>
      )}
    </div>
  );
};

// Main profile component
export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile: originalProfile, loading: profileLoading, updateProfile, refreshProfile } = useUserProfile();
  const router = useRouter();
  const { getThemeClasses } = useGdyupTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [walletEditing, setWalletEditing] = useState(false);
  
  // State for loading spinners
  const [isLoading, setIsLoading] = useState(false);
  
  // Cast profile to ExtendedUserProfile
  const profile = originalProfile as ExtendedUserProfile | null;
  
  // Check if profile is complete
  const isProfileComplete = profile?.onboarding_completed === true;
  
  useEffect(() => {
    // If auth is loaded and user is not logged in, redirect to login
    if (!authLoading && !user) {
      router.push('/gdyup/auth/login?returnUrl=/gdyup/profile');
    }
    
    // If profile is loaded and not complete, redirect to profile setup
    if (!profileLoading && profile && !isProfileComplete) {
      router.push('/gdyup/auth/profile-setup');
    }
  }, [authLoading, user, router, profileLoading, profile, isProfileComplete]);
  
  // Handle profile updates
  const handleUpdateProfile = async (updates: Partial<ExtendedUserProfile>) => {
    setIsLoading(true);
    try {
      await updateProfile(updates as Partial<UserProfile>);
      refreshProfile(); // Refresh to get updated data
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while checking auth and profile
  if (authLoading || profileLoading || !profile || !isProfileComplete) {
    return (
      <ClientContentWrapper>
        <Container className="flex flex-col min-h-screen bg-gray-900">
          <div className="flex-grow flex flex-col justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-gray-400">Loading your profile...</p>
          </div>
        </Container>
      </ClientContentWrapper>
    );
  }
  
  // If profile exists and is complete, show profile page
  return (
    <ClientContentWrapper>
      <Container className="flex flex-col min-h-screen">
        <div className="py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/gdyup/dashboard')}
              className={getThemeClasses({
                base: "mr-4",
                default: "text-gray-400 hover:text-white",
                luxury: "text-blue-400 hover:text-blue-100",
                bitcoin: "text-pink-400 hover:text-pink-100"
              })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className={getThemeClasses({
              base: "text-2xl font-bold",
              default: "text-white",
              luxury: "text-blue-50",
              bitcoin: "text-pink-50"
            })}>Your Profile</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary Card */}
            <Card className={getThemeClasses({
              base: "overflow-hidden",
              default: "bg-gray-900 border-gray-800",
              luxury: "bg-blue-900 border-blue-800",
              bitcoin: "bg-pink-900 border-pink-800",
            })}>
              <CardHeader className="pb-2">
                <CardTitle className={getThemeClasses({
                  base: "",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>Profile</CardTitle>
                <CardDescription className={getThemeClasses({
                  base: "",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className={getThemeClasses({
                      base: "text-xl font-semibold",
                      default: "text-white",
                      luxury: "text-blue-50",
                      bitcoin: "text-pink-50"
                    })}>
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className={getThemeClasses({
                      base: "text-sm",
                      default: "text-gray-400",
                      luxury: "text-blue-400",
                      bitcoin: "text-pink-400"
                    })}>
                      {profile.email}
                    </p>
                    {profile.role && (
                      <p className={getThemeClasses({
                        base: "text-sm mt-1",
                        default: "text-gray-300",
                        luxury: "text-blue-300",
                        bitcoin: "text-pink-300"
                      })}>
                        {profile.role}
                        {profile.affiliation && ` · ${profile.affiliation}`}
                      </p>
                    )}
                  </div>
                </div>
                
                {profile.bio && (
                  <div className={getThemeClasses({
                    base: "text-sm mt-4 p-3 rounded-md",
                    default: "bg-black/30 text-gray-300",
                    luxury: "bg-blue-950/50 text-blue-300",
                    bitcoin: "bg-pink-950/50 text-pink-300"
                  })}>
                    {profile.bio}
                  </div>
                )}
                
                <Button
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2" 
                  onClick={() => router.push('/gdyup/auth/profile-setup?isProfileEdit=true')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile Details
                </Button>
              </CardContent>
            </Card>
            
            {/* Wallet and Nostr Tabs */}
            <Card className={cn(
              "col-span-1 lg:col-span-2",
              getThemeClasses({
                base: "",
                default: "bg-gray-900 border-gray-800",
                luxury: "bg-blue-900 border-blue-800",
                bitcoin: "bg-pink-900 border-pink-800",
              })
            )}>
              <CardHeader className="pb-0">
                <Tabs defaultValue="wallet" className="w-full">
                  <TabsList className={getThemeClasses({
                    base: "grid w-full grid-cols-2",
                    default: "bg-gray-800",
                    luxury: "bg-blue-800",
                    bitcoin: "bg-pink-800",
                  })}>
                    <TabsTrigger value="wallet" className="text-sm">
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet
                    </TabsTrigger>
                    <TabsTrigger value="nostr" className="text-sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Nostr Identity
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="wallet" className="pt-4 space-y-4">
                    <BTCWalletSection 
                      profile={profile}
                      handleUpdate={handleUpdateProfile}
                      isEditing={walletEditing}
                      setIsEditing={setWalletEditing}
                    />
                  </TabsContent>
                  
                  <TabsContent value="nostr" className="pt-4 space-y-4">
                    <NostrSection 
                      profile={profile}
                      handleUpdate={handleUpdateProfile}
                    />
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
            
            {/* Status and Settings Card */}
            <Card className={cn(
              "col-span-1 lg:col-span-3",
              getThemeClasses({
                base: "",
                default: "bg-gray-900 border-gray-800",
                luxury: "bg-blue-900 border-blue-800",
                bitcoin: "bg-pink-900 border-pink-800",
              })
            )}>
              <CardHeader className="pb-2">
                <CardTitle className={getThemeClasses({
                  base: "",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>Account Status</CardTitle>
                <CardDescription className={getThemeClasses({
                  base: "",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>Integration status for your GDY·UP account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={getThemeClasses({
                    base: "p-4 rounded-lg border flex items-center gap-3",
                    default: "bg-gray-800/50 border-gray-700",
                    luxury: "bg-blue-800/50 border-blue-700",
                    bitcoin: "bg-pink-800/50 border-pink-700",
                  })}>
                    <div className={getThemeClasses({
                      base: "rounded-full p-2",
                      default: profile?.btcWalletAddress ? "bg-green-900/20 text-green-500" : "bg-yellow-900/20 text-yellow-500",
                      luxury: profile?.btcWalletAddress ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400",
                      bitcoin: profile?.btcWalletAddress ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400",
                    })}>
                      {profile?.btcWalletAddress ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className={getThemeClasses({
                        base: "font-medium",
                        default: "text-white",
                        luxury: "text-blue-50",
                        bitcoin: "text-pink-50",
                      })}>Wallet Status</p>
                      <p className={getThemeClasses({
                        base: "text-sm",
                        default: "text-gray-400",
                        luxury: "text-blue-400",
                        bitcoin: "text-pink-400",
                      })}>
                        {profile?.btcWalletAddress ? 'Connected' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "p-4 rounded-lg border flex items-center gap-3",
                    default: "bg-gray-800/50 border-gray-700",
                    luxury: "bg-blue-800/50 border-blue-700",
                    bitcoin: "bg-pink-800/50 border-pink-700",
                  })}>
                    <div className={getThemeClasses({
                      base: "rounded-full p-2",
                      default: profile?.nostr_pubkey ? "bg-green-900/20 text-green-500" : "bg-yellow-900/20 text-yellow-500",
                      luxury: profile?.nostr_pubkey ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400",
                      bitcoin: profile?.nostr_pubkey ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400",
                    })}>
                      {profile?.nostr_pubkey ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className={getThemeClasses({
                        base: "font-medium",
                        default: "text-white",
                        luxury: "text-blue-50",
                        bitcoin: "text-pink-50",
                      })}>Nostr Status</p>
                      <p className={getThemeClasses({
                        base: "text-sm",
                        default: "text-gray-400",
                        luxury: "text-blue-400",
                        bitcoin: "text-pink-400",
                      })}>
                        {profile?.nostr_pubkey ? (profile?.nip05 ? 'Verified' : 'Connected') : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "p-4 rounded-lg border flex items-center gap-3",
                    default: "bg-gray-800/50 border-gray-700",
                    luxury: "bg-blue-800/50 border-blue-700",
                    bitcoin: "bg-pink-800/50 border-pink-700",
                  })}>
                    <div className={getThemeClasses({
                      base: "rounded-full p-2",
                      default: "bg-primary/20 text-primary",
                      luxury: "bg-primary/20 text-primary",
                      bitcoin: "bg-primary/20 text-primary",
                    })}>
                      <Settings className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={getThemeClasses({
                        base: "font-medium",
                        default: "text-white",
                        luxury: "text-blue-50",
                        bitcoin: "text-pink-50",
                      })}>Theme</p>
                      <p className={getThemeClasses({
                        base: "text-sm",
                        default: "text-gray-400",
                        luxury: "text-blue-400",
                        bitcoin: "text-pink-400",
                      })}>
                        {profile?.theme || 'Default Theme'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </ClientContentWrapper>
  );
} 