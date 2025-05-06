'use client';

import { useState } from 'react';
import { useNostr } from '../contexts/NostrContext';
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
  User
} from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import NostrIdentityVerifier from './NostrIdentityVerifier';
import { toast } from 'sonner';

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
  
  const [showSettings, setShowSettings] = useState(false);
  const [showIdentityVerifier, setShowIdentityVerifier] = useState(false);
  const { getThemeClasses, getThemedButtonClasses } = useGdyupTheme();
  
  // Handle connection toggle
  const handleConnectionToggle = async () => {
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
    const updatedSettings = { ...settings, [setting]: value };
    const success = await updateSettings({ [setting]: value });
    
    if (success) {
      toast.success(`Nostr setting updated: ${setting}`);
    } else {
      toast.error(`Failed to update Nostr setting: ${setting}`);
    }
  };
  
  // If not initialized, show loading state
  if (!isInitialized) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled 
        className={getThemeClasses({
          base: "gap-2 h-7",
          default: "text-gray-500",
          blue: "text-blue-300",
          pink: "text-pink-300"
        })}
      >
        <Radio className="h-3 w-3 animate-pulse" />
        <span className="text-xs">Nostr</span>
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
              getThemeClasses({
                base: "",
                default: isEnabled 
                  ? (isConnected ? "text-green-600" : "text-amber-600") 
                  : "text-gray-500",
                blue: isEnabled 
                  ? (isConnected ? "text-green-400" : "text-amber-400") 
                  : "text-blue-300",
                pink: isEnabled 
                  ? (isConnected ? "text-green-400" : "text-amber-400") 
                  : "text-pink-300"
              })
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
        
        <DropdownMenuContent className={getThemeClasses({
          base: "min-w-[220px]",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950 border-blue-900 text-blue-50",
          pink: "bg-pink-950 border-pink-900 text-pink-50"
        })}>
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Nostr Status</span>
            {isEnabled && (
              <Badge className={cn(
                "text-xs",
                getThemeClasses({
                  base: "px-1 py-0",
                  default: isConnected 
                    ? "bg-green-100 text-green-800" 
                    : "bg-amber-100 text-amber-800",
                  blue: isConnected 
                    ? "bg-green-900 text-green-100" 
                    : "bg-amber-900 text-amber-100",
                  pink: isConnected 
                    ? "bg-green-900 text-green-100" 
                    : "bg-amber-900 text-amber-100"
                })
              )}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            )}
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className={getThemeClasses({
            base: "",
            default: "bg-gray-100",
            blue: "bg-blue-900/60",
            pink: "bg-pink-900/60"
          })} />
          
          {hasNip05 ? (
            <div className={cn(
              "px-2 py-1.5 text-xs",
              getThemeClasses({
                base: "",
                default: "text-gray-500",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })
            )}>
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3" />
                <span className="font-medium">NIP-05 Identity:</span>
              </div>
              <div className={getThemeClasses({
                base: "ml-4 truncate",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>
                {nip05}
              </div>
            </div>
          ) : (
            <DropdownMenuItem 
              onClick={() => setShowIdentityVerifier(true)}
              className={getThemeClasses({
                base: "",
                default: "text-blue-600 focus:bg-blue-50 focus:text-blue-700",
                blue: "text-blue-300 focus:bg-blue-800 focus:text-blue-50",
                pink: "text-pink-300 focus:bg-pink-800 focus:text-pink-50"
              })}
            >
              <User className="h-4 w-4 mr-2" />
              Verify Nostr Identity
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator className={getThemeClasses({
            base: "",
            default: "bg-gray-100",
            blue: "bg-blue-900/60",
            pink: "bg-pink-900/60"
          })} />
          
          <DropdownMenuItem 
            onClick={handleConnectionToggle}
            disabled={!isEnabled && !hasNip05}
            className={getThemeClasses({
              base: "",
              default: isConnected 
                ? "text-red-600 focus:bg-red-50 focus:text-red-700" 
                : "text-green-600 focus:bg-green-50 focus:text-green-700",
              blue: isConnected 
                ? "text-red-400 focus:bg-red-900/30 focus:text-red-300" 
                : "text-green-400 focus:bg-green-900/30 focus:text-green-300",
              pink: isConnected 
                ? "text-red-400 focus:bg-red-900/30 focus:text-red-300" 
                : "text-green-400 focus:bg-green-900/30 focus:text-green-300"
            })}
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
            className={getThemeClasses({
              base: "",
              default: "focus:bg-gray-50",
              blue: "focus:bg-blue-900",
              pink: "focus:bg-pink-900"
            })}
          >
            <Settings className="h-4 w-4 mr-2" />
            Nostr Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Nostr Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={getThemeClasses({
          base: "border",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950 border-blue-900 text-blue-50",
          pink: "bg-pink-950 border-pink-900 text-pink-50"
        })}>
          <DialogHeader>
            <DialogTitle className={getThemeClasses({
              base: "",
              default: "text-gray-900",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              Nostr Settings
            </DialogTitle>
            <DialogDescription className={getThemeClasses({
              base: "",
              default: "text-gray-500",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              Configure your Nostr integration with GDY·UP
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={getThemeClasses({
                  base: "text-base",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  Enable Nostr
                </Label>
                <div className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  Turn Nostr features on or off
                </div>
              </div>
              <Switch 
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingToggle('enabled', checked)}
                disabled={!hasNip05}
                className={getThemeClasses({
                  base: "",
                  default: "",
                  blue: "data-[state=checked]:bg-[#F25C05]",
                  pink: "data-[state=checked]:bg-[#F7931A]"
                })}
              />
            </div>
            
            <div className={getThemeClasses({
              base: "h-px my-6",
              default: "bg-gray-100",
              blue: "bg-blue-900/60",
              pink: "bg-pink-900/60"
            })} />
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Zap className={cn(
                  "h-5 w-5 mt-0.5",
                  getThemeClasses({
                    base: "",
                    default: "text-amber-500",
                    blue: "text-amber-400",
                    pink: "text-amber-400"
                  })
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemeClasses({
                    base: "",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>
                    Enable Zaps
                  </Label>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>
                    Allow sending and receiving Lightning Network tips
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.enable_zaps}
                onCheckedChange={(checked) => handleSettingToggle('enable_zaps', checked)}
                disabled={!settings.enabled}
                className={getThemeClasses({
                  base: "",
                  default: "",
                  blue: "data-[state=checked]:bg-[#F25C05]",
                  pink: "data-[state=checked]:bg-[#F7931A]"
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <MessageSquare className={cn(
                  "h-5 w-5 mt-0.5",
                  getThemeClasses({
                    base: "",
                    default: "text-blue-500",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemeClasses({
                    base: "",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>
                    Receive Messages
                  </Label>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>
                    Allow receiving direct messages via Nostr
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.receive_messages}
                onCheckedChange={(checked) => handleSettingToggle('receive_messages', checked)}
                disabled={!settings.enabled}
                className={getThemeClasses({
                  base: "",
                  default: "",
                  blue: "data-[state=checked]:bg-[#F25C05]",
                  pink: "data-[state=checked]:bg-[#F7931A]"
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Radio className={cn(
                  "h-5 w-5 mt-0.5",
                  getThemeClasses({
                    base: "",
                    default: "text-green-500",
                    blue: "text-green-400",
                    pink: "text-green-400"
                  })
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemeClasses({
                    base: "",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>
                    Broadcast Offers
                  </Label>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>
                    Broadcast your JetShare offers to the Nostr network
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.broadcast_offers}
                onCheckedChange={(checked) => handleSettingToggle('broadcast_offers', checked)}
                disabled={!settings.enabled}
                className={getThemeClasses({
                  base: "",
                  default: "",
                  blue: "data-[state=checked]:bg-[#F25C05]",
                  pink: "data-[state=checked]:bg-[#F7931A]"
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Lock className={cn(
                  "h-5 w-5 mt-0.5",
                  getThemeClasses({
                    base: "",
                    default: "text-purple-500",
                    blue: "text-purple-400",
                    pink: "text-purple-400"
                  })
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemeClasses({
                    base: "",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>
                    Private Mode
                  </Label>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>
                    Only communicate with known contacts via Nostr
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.private_mode}
                onCheckedChange={(checked) => handleSettingToggle('private_mode', checked)}
                disabled={!settings.enabled}
                className={getThemeClasses({
                  base: "",
                  default: "",
                  blue: "data-[state=checked]:bg-[#F25C05]",
                  pink: "data-[state=checked]:bg-[#F7931A]"
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Wifi className={cn(
                  "h-5 w-5 mt-0.5",
                  getThemeClasses({
                    base: "",
                    default: "text-gray-500",
                    blue: "text-gray-400",
                    pink: "text-gray-400"
                  })
                )} />
                <div className="space-y-0.5">
                  <Label className={getThemeClasses({
                    base: "",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>
                    Auto-Connect
                  </Label>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>
                    Automatically connect to Nostr when launching GDY·UP
                  </div>
                </div>
              </div>
              <Switch 
                checked={settings.auto_connect}
                onCheckedChange={(checked) => handleSettingToggle('auto_connect', checked)}
                disabled={!settings.enabled}
                className={getThemeClasses({
                  base: "",
                  default: "",
                  blue: "data-[state=checked]:bg-[#F25C05]",
                  pink: "data-[state=checked]:bg-[#F7931A]"
                })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
              className={getThemedButtonClasses("outline")}
            >
              Close
            </Button>
            {!hasNip05 && (
              <Button 
                onClick={() => {
                  setShowSettings(false);
                  setShowIdentityVerifier(true);
                }}
                className={getThemedButtonClasses("primary")}
              >
                Verify Identity
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* NIP-05 Identity Verification Dialog */}
      <Dialog open={showIdentityVerifier} onOpenChange={setShowIdentityVerifier}>
        <DialogContent className={getThemeClasses({
          base: "max-w-md border",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950 border-blue-900 text-blue-50",
          pink: "bg-pink-950 border-pink-900 text-pink-50"
        })}>
          <NostrIdentityVerifier />
        </DialogContent>
      </Dialog>
    </>
  );
} 