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
import GdyupClientLayout from '../components/GdyupClientLayout';

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

// Elite BTC wallet component with perfect contrast
const BTCWalletSection = ({ 
  profile, 
  handleUpdate,
  isEditing,
  setIsEditing
}: BTCWalletSectionProps) => {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
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
  
  // Elite editing form with perfect contrast
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={cn("text-sm font-medium", getThemedTextClasses())}>
            Bitcoin Wallet Address
          </label>
          <div className="flex">
            <input 
              type="text" 
              value={walletValue} 
              onChange={(e) => setWalletValue(e.target.value)}
              placeholder="Enter BTC wallet address" 
              className={cn(
                "flex-1 p-3 rounded-l-md border border-r-0 focus:outline-none focus:ring-2 focus:ring-gdyup-primary",
                "bg-gdyup-bg-dark border-gdyup-border",
                getThemedTextClasses()
              )}
            />
            <Button 
              onClick={() => handleCopy(walletValue, 'Address')}
              className={cn("rounded-l-none rounded-r-md", getThemedButtonClasses('secondary'))}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className={cn("text-sm font-medium", getThemedTextClasses())}>
            Lightning Address (LNURL)
          </label>
          <div className="flex">
            <input 
              type="text" 
              value={lnurlValue} 
              onChange={(e) => setLnurlValue(e.target.value)}
              placeholder="you@domain.com or lnurl..." 
              className={cn(
                "flex-1 p-3 rounded-l-md border border-r-0 focus:outline-none focus:ring-2 focus:ring-gdyup-primary",
                "bg-gdyup-bg-dark border-gdyup-border",
                getThemedTextClasses()
              )}
            />
            <Button 
              onClick={() => handleCopy(lnurlValue, 'LNURL')}
              className={cn("rounded-l-none rounded-r-md", getThemedButtonClasses('secondary'))}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className={cn("text-sm font-medium", getThemedTextClasses())}>
            Wallet Type
          </label>
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
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(false)} 
            className="flex-1 border-gdyup-border"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className={cn("flex-1", getThemedButtonClasses('primary'))}
          >
            Save Changes
          </Button>
        </div>
      </div>
    );
  }
  
  // Elite view mode with perfect contrast
  return (
    <div className="space-y-4">
      {profile?.btcWalletAddress ? (
        <>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className={cn("text-sm font-medium", getThemedTextClasses())}>
                BTC Wallet
              </span>
              <div className="flex items-center">
                <span className={cn("font-mono text-sm truncate max-w-[200px]", getThemedTextClasses())}>
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
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {profile.lightningWalletType === 'custodial' ? 'Custodial' : 'Self-Custodial'}
            </Badge>
          </div>
          
          {profile.lnurl && (
            <div className="space-y-1">
              <span className={cn("text-sm font-medium", getThemedTextClasses())}>
                Lightning Address
              </span>
              <div className="flex items-center">
                <span className={cn("font-mono text-sm", getThemedTextClasses())}>
                  {profile.lnurl}
                </span>
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
            className="w-full mt-2 border-gdyup-border" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Wallet Settings
          </Button>
        </>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="rounded-full bg-gdyup-bg-dark h-16 w-16 flex items-center justify-center mx-auto border border-gdyup-border">
            <Wallet className={cn("h-8 w-8", getThemedTextClasses('muted'))} />
          </div>
          <div>
            <h3 className={cn("text-lg font-medium", getThemedTextClasses())}>
              No Wallet Connected
            </h3>
            <p className={cn("text-sm mt-1", getThemedTextClasses('muted'))}>
              Connect a Bitcoin wallet to enable payments and zaps
            </p>
          </div>
          <Button 
            className={cn("mt-2", getThemedButtonClasses('primary'))}
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

// Elite Nostr Identity section with perfect contrast
const NostrSection = ({ profile, handleUpdate }: NostrSectionProps) => {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn(
            "rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border",
            getThemedBackgroundClasses('card')
          )}>
            <h2 className={cn("text-xl font-bold mb-4", getThemedTextClasses())}>
              Verify Nostr Identity
            </h2>
            <NostrIdentityVerifier onComplete={handleCompleteVerification} />
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowVerifier(false)}
                className="border-gdyup-border"
              >
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
              <span className={cn("text-sm font-medium", getThemedTextClasses())}>
                Nostr Identity
              </span>
              <div className="flex items-center">
                <span className={cn("font-mono text-sm truncate max-w-[200px]", getThemedTextClasses())}>
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
              <span className={cn("text-sm font-medium", getThemedTextClasses())}>
                NIP-05 Identifier
              </span>
              <div className="flex items-center">
                <span className={cn("text-sm", getThemedTextClasses())}>
                  {nip05}
                </span>
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
              className={!isConnected ? "border-gdyup-border" : ""}
            >
              {isConnected ? 'Disconnect Relays' : 'Connect Relays'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowVerifier(true)}
              className="border-gdyup-border"
            >
              {nip05 ? 'Update NIP-05' : 'Verify NIP-05'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCopy(`nostr:${pubkey}`, 'Nostr URI')}
              className="border-gdyup-border"
            >
              <QrCode className="h-3.5 w-3.5 mr-1" />
              Copy Nostr URI
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <div className="rounded-full bg-gdyup-bg-dark h-16 w-16 flex items-center justify-center mx-auto border border-gdyup-border">
            <MessageSquare className={cn("h-8 w-8", getThemedTextClasses('muted'))} />
          </div>
          <div>
            <h3 className={cn("text-lg font-medium", getThemedTextClasses())}>
              No Nostr Identity
            </h3>
            <p className={cn("text-sm mt-1", getThemedTextClasses('muted'))}>
              Connect your Nostr pubkey to enable messaging and zaps
            </p>
          </div>
          <Button 
            className={cn("mt-2", getThemedButtonClasses('primary'))}
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
  return (
    <GdyupClientLayout>
      <ProfilePageContent />
    </GdyupClientLayout>
  );
}

function ProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile: originalProfile, loading: profileLoading, updateProfile, refreshProfile } = useUserProfile();
  const router = useRouter();
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
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
  
  // Elite loading state with perfect contrast
  if (authLoading || profileLoading || !profile || !isProfileComplete) {
    return (
      <Container className="flex flex-col min-h-screen">
        <div className="flex-grow flex flex-col justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-gdyup-primary mb-4" />
          <p className={getThemedTextClasses('muted')}>Loading your profile...</p>
        </div>
      </Container>
    );
  }
  
  // Elite profile page with perfect contrast
  return (
    <Container className="flex flex-col min-h-screen">
        <div className="py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/gdyup/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className={cn("text-2xl font-bold", getThemedTextClasses())}>
              Profile
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Elite Profile Summary Card */}
            <Card className={cn("overflow-hidden", getThemedBackgroundClasses('card'))}>
              <CardHeader className="pb-2">
                <CardTitle className={getThemedTextClasses()}>
                  Profile
                </CardTitle>
                <CardDescription className={getThemedTextClasses('muted')}>
                  Your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-gdyup-primary">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-gdyup-primary/20 text-gdyup-primary text-lg">
                      {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className={cn("text-xl font-semibold", getThemedTextClasses())}>
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                      {profile.email}
                    </p>
                    {profile.role && (
                      <p className={cn("text-sm mt-1", getThemedTextClasses('secondary'))}>
                        {profile.role}
                        {profile.affiliation && ` · ${profile.affiliation}`}
                      </p>
                    )}
                  </div>
                </div>
                
                {profile.bio && (
                  <div className={cn(
                    "text-sm mt-4 p-3 rounded-md border",
                    "bg-gdyup-bg-dark/50 border-gdyup-border",
                    getThemedTextClasses()
                  )}>
                    {profile.bio}
                  </div>
                )}
                
                <Button
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 border-gdyup-border" 
                  onClick={() => router.push('/gdyup/auth/profile-setup?isProfileEdit=true')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile Details
                </Button>
              </CardContent>
            </Card>
            
            {/* Elite Wallet and Nostr Tabs */}
            <Card className={cn(
              "col-span-1 lg:col-span-2",
              getThemedBackgroundClasses('card')
            )}>
              <CardHeader className="pb-0">
                <Tabs defaultValue="wallet" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gdyup-bg-dark">
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
            
            {/* Elite Status and Settings Card */}
            <Card className={cn(
              "col-span-1 lg:col-span-3",
              getThemedBackgroundClasses('card')
            )}>
              <CardHeader className="pb-2">
                <CardTitle className={getThemedTextClasses()}>
                  Account Status
                </CardTitle>
                <CardDescription className={getThemedTextClasses('muted')}>
                  Integration status for your GDY·UP account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={cn(
                    "p-4 rounded-lg border flex items-center gap-3",
                    "bg-gdyup-bg-dark/50 border-gdyup-border"
                  )}>
                    <div className={cn(
                      "rounded-full p-2",
                      profile?.btcWalletAddress 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {profile?.btcWalletAddress ? 
                        <CheckCircle className="h-6 w-6" /> : 
                        <AlertCircle className="h-6 w-6" />
                      }
                    </div>
                    <div>
                      <p className={cn("font-medium", getThemedTextClasses())}>
                        Wallet Status
                      </p>
                      <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                        {profile?.btcWalletAddress ? 'Connected' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-lg border flex items-center gap-3",
                    "bg-gdyup-bg-dark/50 border-gdyup-border"
                  )}>
                    <div className={cn(
                      "rounded-full p-2",
                      profile?.nostr_pubkey 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {profile?.nostr_pubkey ? 
                        <CheckCircle className="h-6 w-6" /> : 
                        <AlertCircle className="h-6 w-6" />
                      }
                    </div>
                    <div>
                      <p className={cn("font-medium", getThemedTextClasses())}>
                        Nostr Status
                      </p>
                      <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                        {profile?.nostr_pubkey ? (profile?.nip05 ? 'Verified' : 'Connected') : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-lg border flex items-center gap-3",
                    "bg-gdyup-bg-dark/50 border-gdyup-border"
                  )}>
                    <div className="rounded-full p-2 bg-gdyup-primary/20 text-gdyup-primary">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={cn("font-medium", getThemedTextClasses())}>
                        Theme
                      </p>
                      <p className={cn("text-sm", getThemedTextClasses('muted'))}>
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
    );
  }
