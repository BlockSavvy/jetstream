'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle, XCircle, KeyRound, RefreshCw, ExternalLink, Check, Copy } from 'lucide-react';
import { useNostr } from '@/components/nostr-provider';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NostrProfile } from '@/types/nostr';
import * as NostrUtils from '@/lib/services/nostr';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';

export default function NostrProfileSettings() {
  const {
    isEnabled,
    hasExtension,
    isConnected,
    pubkey,
    npub,
    connectExtension,
    disconnectNostr,
    generateKeypair,
    getNostrProfile,
    updateNostrProfile,
    verifyNip05,
    error: nostrError
  } = useNostr();
  const { getThemedButtonClasses, getThemedTextClasses, getThemedBadgeClasses } = useGdyupTheme();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const [formData, setFormData] = useState<{
    nip05: string;
    lud16: string;
    broadcastOffers: boolean;
    receiveMessages: boolean;
    enableZaps: boolean;
    privateMode: boolean;
    autoConnect: boolean;
  }>({
    nip05: '',
    lud16: '',
    broadcastOffers: false,
    receiveMessages: false,
    enableZaps: false,
    privateMode: true,
    autoConnect: false
  });
  
  // Initialize form data from the user's Nostr profile
  useEffect(() => {
    const profile = getNostrProfile();
    if (profile) {
      setFormData({
        nip05: profile.nip05 || '',
        lud16: profile.lud16 || '',
        broadcastOffers: profile.nostr_settings?.broadcast_offers || false,
        receiveMessages: profile.nostr_settings?.receive_messages || false,
        enableZaps: profile.nostr_settings?.enable_zaps || false,
        privateMode: profile.nostr_settings?.private_mode || true,
        autoConnect: profile.nostr_settings?.auto_connect || false
      });
      
      // Check NIP-05 verification status
      if (profile.nip05 && pubkey) {
        verifyNip05Status(profile.nip05);
      }
    }
  }, [getNostrProfile, pubkey]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Connect to Nostr extension
  const handleConnectExtension = async () => {
    setIsLoading(true);
    try {
      const connected = await connectExtension();
      if (!connected) {
        toast.error('Could not connect to Nostr extension');
      }
    } catch (error) {
      console.error('Error connecting to Nostr extension:', error);
      toast.error('Error connecting to Nostr extension');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate new keypair
  const handleGenerateKeypair = async () => {
    setIsLoading(true);
    try {
      await generateKeypair();
      toast.success('Generated new Nostr keypair');
    } catch (error) {
      console.error('Error generating keypair:', error);
      toast.error('Error generating keypair');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from Nostr
  const handleDisconnect = () => {
    disconnectNostr();
  };
  
  // Verify NIP-05 identifier
  const verifyNip05Status = async (nip05: string) => {
    if (!nip05 || !pubkey) return;
    
    setIsVerifying(true);
    try {
      const isVerified = await verifyNip05(nip05);
      setIsNip05Verified(isVerified);
    } catch (error) {
      console.error('Error verifying NIP-05:', error);
      setIsNip05Verified(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle NIP-05 verification button click
  const handleVerifyNip05 = async () => {
    await verifyNip05Status(formData.nip05);
    if (isNip05Verified) {
      toast.success('NIP-05 verification successful!');
    } else {
      toast.error('NIP-05 verification failed');
    }
  };
  
  // Copy npub to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  
  // Save Nostr profile settings
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const nostrProfile: Partial<NostrProfile> = {
        nip05: formData.nip05 || null,
        lud16: formData.lud16 || null,
        nostr_settings: {
          enabled: isEnabled,
          broadcast_offers: formData.broadcastOffers,
          receive_messages: formData.receiveMessages,
          enable_zaps: formData.enableZaps,
          private_mode: formData.privateMode,
          auto_connect: formData.autoConnect
        }
      };
      
      const updated = await updateNostrProfile(nostrProfile);
      if (updated) {
        toast.success('Nostr settings saved successfully');
      } else {
        toast.error('Failed to save Nostr settings');
      }
    } catch (error) {
      console.error('Error saving Nostr settings:', error);
      toast.error('Error saving Nostr settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <KeyRound className={`h-5 w-5 mr-2 ${getThemedTextClasses('primary')}`} />
              Nostr Identity
              <Badge 
                variant={isEnabled ? "default" : "secondary"}
                className={`ml-2 text-xs ${isEnabled ? getThemedBadgeClasses('success') : getThemedBadgeClasses('secondary')}`}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Connect your Nostr identity for decentralized messaging and payments
            </CardDescription>
          </div>
          
          {npub && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(npub)}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy npub</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {nostrError && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{nostrError}</AlertDescription>
          </Alert>
        )}
        
        {!isConnected ? (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="extension">Use Nostr Extension</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isLoading || !hasExtension}
                  onClick={handleConnectExtension}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Connect
                </Button>
              </div>
              
              {!hasExtension && (
                <p className="text-sm text-muted-foreground">
                  No Nostr extension detected. Install{' '}
                  <a 
                    href="https://getalby.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={getThemedTextClasses('primary') + ' hover:underline'}
                  >
                    Alby
                  </a>{' '}
                  or{' '}
                  <a 
                    href="https://github.com/fiatjaf/nos2x" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={getThemedTextClasses('primary') + ' hover:underline'}
                  >
                    nos2x
                  </a>
                </p>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="keypair">Generate New Keys</Label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={handleGenerateKeypair}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate a new Nostr keypair for this account (advanced)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="npub">Nostr Public Key (npub)</Label>
              <div className="flex">
                <Input
                  id="npub"
                  name="npub"
                  value={npub || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => copyToClipboard(npub || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This is your Nostr identifier
              </p>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="nip05" className="flex items-center">
                  NIP-05 Identity
                  {isVerifying ? (
                    <Loader2 className={`h-4 w-4 ml-2 animate-spin ${getThemedTextClasses('primary')}`} />
                  ) : isNip05Verified ? (
                    <CheckCircle className={`h-4 w-4 ml-2 ${getThemedTextClasses('success')}`} />
                  ) : formData.nip05 ? (
                    <XCircle className={`h-4 w-4 ml-2 ${getThemedTextClasses('destructive')}`} />
                  ) : null}
                </Label>
                
                {formData.nip05 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVerifyNip05}
                    disabled={isVerifying}
                    className="h-7"
                  >
                    Verify
                  </Button>
                )}
              </div>
              <Input
                id="nip05"
                name="nip05"
                placeholder="you@gdyup.xyz"
                value={formData.nip05}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Human-readable identifier for verification (like an email)
              </p>
            </div>
            
            <div className="flex flex-col space-y-1">
              <Label htmlFor="lud16" className="flex items-center">
                Lightning Address (lud16)
              </Label>
              <Input
                id="lud16"
                name="lud16"
                placeholder="you@getalby.com"
                value={formData.lud16}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Lightning address for receiving payments
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="broadcastOffers">Broadcast Offers to Nostr</Label>
                  <p className="text-xs text-muted-foreground">
                    Share your GDY·UP offers with the Nostr network
                  </p>
                </div>
                <Switch
                  id="broadcastOffers"
                  checked={formData.broadcastOffers}
                  onCheckedChange={(checked) => handleSwitchChange('broadcastOffers', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="receiveMessages">Nostr Messaging</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive messages through Nostr's encrypted DMs
                  </p>
                </div>
                <Switch
                  id="receiveMessages"
                  checked={formData.receiveMessages}
                  onCheckedChange={(checked) => handleSwitchChange('receiveMessages', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableZaps">Enable Zaps</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow Lightning Network zaps for your offers
                  </p>
                </div>
                <Switch
                  id="enableZaps"
                  checked={formData.enableZaps}
                  onCheckedChange={(checked) => handleSwitchChange('enableZaps', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="privateMode">Private Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Limit which data is shared with the Nostr network
                  </p>
                </div>
                <Switch
                  id="privateMode"
                  checked={formData.privateMode}
                  onCheckedChange={(checked) => handleSwitchChange('privateMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoConnect">Auto-Connect</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically connect to Nostr when available
                  </p>
                </div>
                <Switch
                  id="autoConnect"
                  checked={formData.autoConnect}
                  onCheckedChange={(checked) => handleSwitchChange('autoConnect', checked)}
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full mt-4"
            >
              Disconnect Nostr
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            // Reset form to initial values
            const profile = getNostrProfile();
            if (profile) {
              setFormData({
                nip05: profile.nip05 || '',
                lud16: profile.lud16 || '',
                broadcastOffers: profile.nostr_settings?.broadcast_offers || false,
                receiveMessages: profile.nostr_settings?.receive_messages || false,
                enableZaps: profile.nostr_settings?.enable_zaps || false,
                privateMode: profile.nostr_settings?.private_mode || true,
                autoConnect: profile.nostr_settings?.auto_connect || false
              });
            }
          }}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className={getThemedButtonClasses('primary')}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 