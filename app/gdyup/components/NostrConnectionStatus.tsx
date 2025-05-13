'use client';

import { useState } from 'react';
import { useNostr } from '../contexts/NostrContext';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Wifi, 
  WifiOff, 
  Zap, 
  MessageSquare, 
  Radio, 
  Lock, 
  Settings, 
  User,
  LogIn
} from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import NostrIdentityVerifier from './NostrIdentityVerifier';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NostrConnectionStatus() {
  const { 
    isInitialized,
    isEnabled, 
    isConnected, 
    hasNip05,
    pubkey,
    nip05,
    settings,
    connect,
    disconnect,
    updateSettings
  } = useNostr();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showIdentityVerifier, setShowIdentityVerifier] = useState(false);
  const { 
    getThemedButtonClasses, 
    getThemedTextClasses, 
    getThemedBackgroundClasses, 
    getThemedBadgeClasses 
  } = useGdyupTheme();
  
  // Handle connection toggle
  const handleConnectionToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to use Nostr features');
      router.push('/gdyup/auth/login?returnUrl=/gdyup/settings/nostr');
      return;
    }
    
    if (!hasNip05) {
      setShowIdentityVerifier(true);
      return;
    }
    
    if (isConnected) {
      disconnect();
      toast.success('Disconnected from Nostr network');
    } else {
      const success = await connect();
      if (success) {
        toast.success('Connected to Nostr network');
      } else {
        toast.error('Failed to connect to Nostr network');
      }
    }
  };
  
  // Handle settings toggle
  const handleSettingToggle = async (setting: keyof typeof settings, value: boolean) => {
    if (!user) {
      toast.error('You must be logged in to change Nostr settings');
      router.push('/gdyup/auth/login?returnUrl=/gdyup/settings/nostr');
      return;
    }
    
    const updatedSettings = { ...settings, [setting]: value };
    const success = await updateSettings({ [setting]: value });
    
    if (success) {
      toast.success(`Nostr setting updated: ${setting}`);
    } else {
      toast.error(`Failed to update Nostr setting: ${setting}`);
    }
  };
  
  // If auth is loading or Nostr is not initialized, show loading state
  if (authLoading || !isInitialized) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled 
        className={cn("gap-2 h-7", getThemedTextClasses('muted'))}
      >
        <Radio className="h-3 w-3 animate-pulse" />
        <span className="text-xs">Nostr</span>
      </Button>
    );
  }
  
  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.push('/gdyup/auth/login?returnUrl=/gdyup/settings/nostr')}
        className={cn("gap-2 h-7", getThemedTextClasses('muted'))}
      >
        <LogIn className="h-3 w-3" />
        <span className="text-xs">Login for Nostr</span>
      </Button>
    );
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-2 h-7",
              isEnabled 
                ? (isConnected 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-amber-600 dark:text-amber-400") 
                : getThemedTextClasses('muted')
            )}
          >
            {isEnabled ? (
              isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />
            ) : (
              <Radio className="h-3 w-3" />
            )}
            <span className="text-xs">Nostr</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className={cn(
          "min-w-[220px]",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <DropdownMenuLabel className="flex justify-between items-center">
            <span className={getThemedTextClasses()}>Nostr Status</span>
            {isEnabled && (
              <Badge className={cn(
                "text-xs px-1 py-0",
                isConnected 
                  ? getThemedBadgeClasses('success')
                  : getThemedBadgeClasses('warning')
              )}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            )}
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-gdyup-border" />
          
          {hasNip05 ? (
            <div className={cn(
              "px-2 py-1.5 text-xs",
              getThemedTextClasses('muted')
            )}>
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3" />
                <span className="font-medium">NIP-05 Identity:</span>
              </div>
              <div className={cn("ml-4 truncate", getThemedTextClasses())}>
                {nip05}
              </div>
            </div>
          ) : (
            <DropdownMenuItem 
              onClick={() => setShowIdentityVerifier(true)}
              className={cn(getThemedTextClasses('secondary'))}
            >
              <User className="h-4 w-4 mr-2" />
              Verify Nostr Identity
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator className="bg-gdyup-border" />
          
          <DropdownMenuItem 
            onClick={handleConnectionToggle}
            disabled={!isEnabled && !hasNip05}
            className={cn(
              isConnected 
                ? "text-red-600 dark:text-red-400" 
                : "text-green-600 dark:text-green-400"
            )}
          >
            {isConnected ? (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Disconnect from Network
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Connect to Network
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowSettings(true)}
            className={getThemedTextClasses()}
          >
            <Settings className="h-4 w-4 mr-2" />
            Nostr Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Nostr Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={cn(
          "max-w-md",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <DialogHeader>
            <DialogTitle className={getThemedTextClasses()}>
              Nostr Settings
            </DialogTitle>
            <DialogDescription className={getThemedTextClasses('muted')}>
              Configure your Nostr integration preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={getThemedTextClasses()}>
                  Enable Nostr
                </Label>
                <div className={getThemedTextClasses('muted') + " text-xs"}>
                  Turn Nostr features on or off
                </div>
              </div>
              <Switch 
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingToggle('enabled', checked)}
                disabled={!hasNip05}
              />
            </div>
            
            <div className="h-px my-6 bg-gdyup-border" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Zap className={cn(
                  "h-5 w-5 mt-0.5",
                  "text-amber-500 dark:text-amber-400"
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemedTextClasses()}>
                    Enable Zaps
                  </Label>
                  <div className={getThemedTextClasses('muted') + " text-xs"}>
                    Allow sending and receiving Bitcoin zaps
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.enable_zaps}
                onCheckedChange={(checked) => handleSettingToggle('enable_zaps', checked)}
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <MessageSquare className={cn(
                  "h-5 w-5 mt-0.5",
                  "text-blue-500 dark:text-blue-400"
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemedTextClasses()}>
                    Receive Messages
                  </Label>
                  <div className={getThemedTextClasses('muted') + " text-xs"}>
                    Allow receiving direct messages via Nostr
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.receive_messages}
                onCheckedChange={(checked) => handleSettingToggle('receive_messages', checked)}
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Radio className={cn(
                  "h-5 w-5 mt-0.5",
                  "text-green-500 dark:text-green-400"
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemedTextClasses()}>
                    Broadcast Offers
                  </Label>
                  <div className={getThemedTextClasses('muted') + " text-xs"}>
                    Broadcast your JetShare offers to the Nostr network
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.broadcast_offers}
                onCheckedChange={(checked) => handleSettingToggle('broadcast_offers', checked)}
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Lock className={cn(
                  "h-5 w-5 mt-0.5",
                  "text-purple-500 dark:text-purple-400"
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemedTextClasses()}>
                    Private Mode
                  </Label>
                  <div className={getThemedTextClasses('muted') + " text-xs"}>
                    Only communicate with known contacts via Nostr
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.private_mode}
                onCheckedChange={(checked) => handleSettingToggle('private_mode', checked)}
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Wifi className={cn(
                  "h-5 w-5 mt-0.5",
                  "text-blue-500 dark:text-blue-400"
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemedTextClasses()}>
                    Auto-Connect
                  </Label>
                  <div className={getThemedTextClasses('muted') + " text-xs"}>
                    Automatically connect to relays when enabled
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.auto_connect}
                onCheckedChange={(checked) => handleSettingToggle('auto_connect', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowSettings(false)}
              className={getThemedButtonClasses("primary")}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Nostr Identity Verifier Dialog */}
      <Dialog open={showIdentityVerifier} onOpenChange={setShowIdentityVerifier}>
        <DialogContent className={cn(
          "max-w-md",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <DialogHeader>
            <DialogTitle className={getThemedTextClasses()}>
              Verify Nostr Identity
            </DialogTitle>
            <DialogDescription className={getThemedTextClasses('muted')}>
              Set up your Nostr identity to enable all features
            </DialogDescription>
          </DialogHeader>
          
          <NostrIdentityVerifier 
            onComplete={() => setShowIdentityVerifier(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 