'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { useNostr } from '../../contexts/NostrContext';
import { 
  Wallet,
  Loader2,
  Copy,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Radio,
  ExternalLink,
  Bitcoin,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import NostrIdentityVerifier from '../NostrIdentityVerifier';
import NostrConnectionStatus from '../NostrConnectionStatus';
import NostrRelayStatus from '../NostrRelayStatus';
import NostrVerificationBadge from '../NostrVerificationBadge';
import { cn } from '@/lib/utils';

interface UserWallet {
  id?: string;
  user_id?: string;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  custodial?: boolean;
  label?: string;
  nostr_linked?: boolean;
  nostr_pubkey?: string | null;
  nip05?: string | null;
  nip05_verified?: boolean;
}

export default function WalletIdentityTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [lightningAddress, setLightningAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses } = useGdyupTheme();
  const { user } = useAuth();
  const { pubkey, nip05, isConnected, isEnabled, hasNip05 } = useNostr();

  // Add state to cache data to prevent excessive API calls
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const CACHE_TIMEOUT = 30000; // 30 seconds cache

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.id) return;
      
      // Check if we have recent data to avoid excessive API calls
      const now = Date.now();
      if (wallet && now - lastFetchTime < CACHE_TIMEOUT && fetchAttempts > 0) {
        console.log('Using cached wallet data');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setFetchAttempts(prev => prev + 1);
      
      try {
        // First try to get profile data which has the correct wallet info
        const profileResponse = await fetch(`/api/gdyup/profile?userId=${user.id}`);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          
          if (profileData.profile) {
            console.log('Loaded profile wallet data:', {
              btcAddress: profileData.profile.btcWalletAddress,
              bitcoin_address: profileData.profile.bitcoin_address,
              lightning: profileData.profile.lightning_address,
              nip05: profileData.profile.nip05,
              nostrPubkey: profileData.profile.nostr_pubkey,
              nip05Verified: profileData.profile.nip05_verified
            });
            
            // Use profile data for wallet info since it's more reliable
            const bitcoinAddress = profileData.profile.btcWalletAddress || 
                                  profileData.profile.bitcoin_address || 
                                  null;
            
            setWallet({
              user_id: user.id,
              bitcoin_address: bitcoinAddress,
              lightning_address: profileData.profile.lightning_address || profileData.profile.lnurl || null,
              custodial: profileData.profile.lightningWalletType === 'custodial',
              nostr_linked: !!profileData.profile.nostr_pubkey,
              nostr_pubkey: profileData.profile.nostr_pubkey || null,
              nip05: profileData.profile.nip05 || null,
              nip05_verified: profileData.profile.nip05_verified || false
            });
            
            // Set the form values to match
            setBitcoinAddress(bitcoinAddress || '');
            setLightningAddress(profileData.profile.lightning_address || profileData.profile.lnurl || '');
            
            // Update cache timestamp
            setLastFetchTime(now);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to wallet-specific API
        const response = await fetch(`/api/gdyup/wallet?userId=${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.wallet) {
            console.log('Loaded wallet API data:', data.wallet);
            setWallet(data.wallet);
            setBitcoinAddress(data.wallet.bitcoin_address || '');
            setLightningAddress(data.wallet.lightning_address || '');
            setLastFetchTime(now);
          }
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error('Failed to load wallet data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWalletData();
  }, [user?.id, wallet, lastFetchTime, fetchAttempts]);

  const handleSaveWallet = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/gdyup/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          bitcoin_address: bitcoinAddress,
          lightning_address: lightningAddress,
          custodial: true,
          nostr_linked: isEnabled && isConnected
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save wallet information');
      }
      
      const data = await response.json();
      setWallet(data.wallet);
      setEditMode(false);
      
      // Clear cache time to force a refresh
      setLastFetchTime(0);
      
      toast.success('Wallet information saved successfully');
    } catch (error) {
      console.error('Error saving wallet information:', error);
      toast.error('Failed to save wallet information');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className={getThemedTextClasses()}>
                  Bitcoin Wallet
                </CardTitle>
                <CardDescription className={getThemedTextClasses('muted')}>
                  Your BTC and Lightning payment details
                </CardDescription>
              </div>
              
              <div className={cn("p-2 rounded-full bg-gdyup-bg-dark text-amber-500")}>
                <Bitcoin className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className={cn("h-5 w-40 bg-gdyup-bg-dark")} />
                <Skeleton className={cn("h-10 w-full bg-gdyup-bg-dark")} />
                <Skeleton className={cn("h-5 w-40 bg-gdyup-bg-dark")} />
                <Skeleton className={cn("h-10 w-full bg-gdyup-bg-dark")} />
              </div>
            ) : editMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={getThemedTextClasses('muted')}>
                    BTC Address
                  </Label>
                  <Input
                    value={bitcoinAddress}
                    onChange={(e) => setBitcoinAddress(e.target.value)}
                    placeholder="bc1q..."
                    className={cn("bg-gdyup-bg-dark border-gdyup-border", getThemedTextClasses())}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={getThemedTextClasses('muted')}>
                    Lightning Address (LNURL / LUD16)
                  </Label>
                  <Input
                    value={lightningAddress}
                    onChange={(e) => setLightningAddress(e.target.value)}
                    placeholder="you@provider.com"
                    className={cn("bg-gdyup-bg-dark border-gdyup-border", getThemedTextClasses())}
                  />
                </div>
                
                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    className={cn("flex-1", "border-gdyup-border", getThemedTextClasses())}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleSaveWallet}
                    disabled={isSaving}
                    className={cn("flex-1", getThemedButtonClasses('primary'))}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : wallet ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className={getThemedTextClasses('muted') + " text-sm"}>
                    BTC Address
                  </div>
                  {wallet.bitcoin_address ? (
                    <div className="flex justify-between items-center">
                      <div className={cn("font-mono text-sm break-all", getThemedTextClasses())}>
                        {wallet.bitcoin_address}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(wallet.bitcoin_address!, 'BTC Address')}
                        className={cn("h-8 w-8", getThemedTextClasses('muted'))}
                      >
                        {copiedField === 'BTC Address' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className={cn("text-sm italic", getThemedTextClasses('muted'))}>
                      No BTC address set
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className={getThemedTextClasses('muted') + " text-sm"}>
                    Lightning Address
                  </div>
                  {wallet.lightning_address ? (
                    <div className="flex justify-between items-center">
                      <div className={cn("font-mono text-sm break-all", getThemedTextClasses())}>
                        {wallet.lightning_address}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(wallet.lightning_address!, 'Lightning Address')}
                        className={cn("h-8 w-8", getThemedTextClasses('muted'))}
                      >
                        {copiedField === 'Lightning Address' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className={cn("text-sm italic", getThemedTextClasses('muted'))}>
                      No Lightning Address set
                    </div>
                  )}
                </div>
                
                <div className="pt-3">
                  <Button
                    onClick={() => setEditMode(true)}
                    className={cn("w-full", getThemedButtonClasses('primary'))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Wallet Information
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={cn(
                  "text-center p-4 rounded-lg border",
                  "bg-gdyup-bg-dark/50 border-gdyup-border",
                  getThemedTextClasses('muted')
                )}>
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p className="mb-4">No wallet information found. Add your Bitcoin and Lightning addresses.</p>
                  <Button
                    onClick={() => setEditMode(true)}
                    className={getThemedButtonClasses('primary')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Wallet
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className={cn(
            "flex justify-between text-xs border-t",
            "border-gdyup-border",
            getThemedTextClasses('muted')
          )}>
            <div>Self-custodial wallet</div>
            {wallet?.nostr_linked && isConnected && (
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <span>Linked with Nostr</span>
              </div>
            )}
          </CardFooter>
        </Card>

        <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className={getThemedTextClasses()}>
                  Nostr Identity
                </CardTitle>
                <CardDescription className={getThemedTextClasses('muted')}>
                  Your decentralized web identity
                </CardDescription>
              </div>
              
              <div className={cn("p-2 rounded-full bg-gdyup-bg-dark text-blue-500")}>
                <Radio className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className={cn("h-5 w-40 bg-gdyup-bg-dark")} />
                <Skeleton className={cn("h-10 w-full bg-gdyup-bg-dark")} />
                <Skeleton className={cn("h-5 w-40 bg-gdyup-bg-dark")} />
                <Skeleton className={cn("h-10 w-full bg-gdyup-bg-dark")} />
              </div>
            ) : (!wallet?.nip05 && !nip05) ? (
              <NostrIdentityVerifier />
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className={getThemedTextClasses('muted') + " text-sm"}>
                    NIP-05 Identity
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("font-medium", getThemedTextClasses())}>
                      {wallet?.nip05 || nip05 || 'Not set'}
                    </div>
                    <NostrVerificationBadge 
                      pubkey={wallet?.nostr_pubkey || pubkey} 
                      nip05={wallet?.nip05 || nip05}
                      nip05_verified={wallet?.nip05_verified || hasNip05}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className={getThemedTextClasses('muted') + " text-sm"}>
                    Nostr Public Key
                  </div>
                  <div className="flex justify-between items-center">
                    {wallet?.nostr_pubkey || pubkey ? (
                      <div className={cn("font-mono text-sm break-all", getThemedTextClasses())}>
                        {(wallet?.nostr_pubkey || pubkey) ? 
                          `${(wallet?.nostr_pubkey || pubkey || '').substring(0, 8)}...${(wallet?.nostr_pubkey || pubkey || '').substring((wallet?.nostr_pubkey || pubkey || '').length - 8)}` 
                          : 'No public key found'}
                      </div>
                    ) : (
                      <div className={cn("text-sm italic", getThemedTextClasses('muted'))}>
                        No Nostr public key connected
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => (wallet?.nostr_pubkey || pubkey) && copyToClipboard(wallet?.nostr_pubkey || pubkey || '', 'Nostr Public Key')}
                      className={cn("h-8 w-8", getThemedTextClasses('muted'))}
                      disabled={!(wallet?.nostr_pubkey || pubkey)}
                    >
                      {copiedField === 'Nostr Public Key' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className={getThemedTextClasses('muted') + " text-sm mb-2"}>
                    Relay Connection Status
                  </div>
                  <NostrRelayStatus isConnected={isConnected} className={getThemedBadgeClasses('success')} />
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Force refresh wallet data
                      setLastFetchTime(0);
                      setWallet(null);
                    }}
                    className={cn(
                      "w-full",
                      "border-gdyup-border",
                      getThemedTextClasses('muted')
                    )}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Nostr Identity
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className={cn("border-t border-gdyup-border")}>
            <NostrConnectionStatus />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Edit icon component
function Edit({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
} 