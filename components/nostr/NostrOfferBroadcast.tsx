'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Globe, Share2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNostr } from '@/components/nostr-provider';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { NostrJetShareOffer, NostrEventKind } from '@/types/nostr';
import * as NostrUtils from '@/lib/services/nostr';

interface NostrOfferBroadcastProps {
  offer: JetShareOfferWithUser;
  onBroadcastSuccess?: () => void;
}

export default function NostrOfferBroadcast({ offer, onBroadcastSuccess }: NostrOfferBroadcastProps) {
  const {
    isEnabled,
    hasExtension,
    isConnected,
    pubkey,
    npub,
    connectExtension,
    disconnectNostr,
    signEvent,
    publishEvent,
    relays,
    connectRelay,
    getNostrProfile,
    error: nostrError
  } = useNostr();
  
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastOptions, setBroadcastOptions] = useState({
    includeLightningAddress: true,
    includeContactInfo: false,
    privateMode: true,
    addTaggedRelays: false,
  });
  const [isBroadcasted, setIsBroadcasted] = useState(false);
  
  // Check if this offer is already broadcasted
  useEffect(() => {
    // This would check the relays for existing events with this offer ID
    // For now, we'll just simulate as if it's not yet broadcasted
    setIsBroadcasted(false);
  }, [offer]);
  
  // Broadcast the offer to Nostr relays
  const broadcastOffer = async () => {
    if (!isConnected || !pubkey || !offer) {
      toast.error('Nostr connection required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get user profile to check for Lightning address
      const profile = getNostrProfile();
      
      // Prepare the offer data
      const nostrOffer: NostrJetShareOffer = {
        id: offer.id,
        departure_location: offer.departure_location,
        arrival_location: offer.arrival_location,
        flight_date: offer.flight_date,
        departure_time: offer.departure_time || '',
        requested_share_amount: offer.requested_share_amount,
        total_flight_cost: offer.total_flight_cost,
        aircraft_model: offer.aircraft_model,
        total_seats: offer.total_seats,
        available_seats: offer.available_seats,
        creator_npub: npub || '',
        // Include Lightning address if enabled and available
        creator_lud16: broadcastOptions.includeLightningAddress ? profile?.lud16 || undefined : undefined,
        expires_at: offer.expires_at
      };
      
      // Create the event
      const eventData = NostrUtils.createJetShareOfferEvent(pubkey, nostrOffer);
      
      // Sign the event
      const signedEvent = await signEvent(eventData);
      
      if (!signedEvent) {
        throw new Error('Failed to sign event');
      }
      
      // Publish to connected relays
      let publishedCount = 0;
      const relayPromises = relays
        .filter(relay => relay.status === 'connected')
        .map(async (relay) => {
          try {
            await publishEvent(signedEvent);
            publishedCount++;
            return true;
          } catch (e) {
            console.error(`Failed to publish to relay ${relay.url}:`, e);
            return false;
          }
        });
      
      await Promise.all(relayPromises);
      
      if (publishedCount === 0) {
        // Try to connect to relays first
        const connectPromises = relays.map(relay => connectRelay(relay.url));
        await Promise.all(connectPromises);
        
        // Try publishing again
        const secondAttempt = await publishEvent(signedEvent);
        
        if (!secondAttempt) {
          throw new Error('Failed to publish to any relays');
        }
      }
      
      setIsBroadcasted(true);
      toast.success('Offer broadcasted to Nostr network!');
      
      if (onBroadcastSuccess) {
        onBroadcastSuccess();
      }
    } catch (error) {
      console.error('Error broadcasting offer:', error);
      toast.error('Failed to broadcast offer: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
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
  
  // If Nostr is not enabled, show a simple info message
  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2 text-amber-500" />
            Decentralized Broadcast
          </CardTitle>
          <CardDescription>
            Share your offer with the Nostr network for wider reach
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Nostr Integration Not Enabled</AlertTitle>
            <AlertDescription>
              Enable Nostr in your profile settings to broadcast offers to the decentralized network.
            </AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/settings'}
          >
            Go to Settings
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If already broadcasted, show success message
  if (isBroadcasted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2 text-amber-500" />
            Offer Broadcasted
          </CardTitle>
          <CardDescription>
            Your offer is now visible on the Nostr network
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-center text-sm mb-2">
              Your flight share offer has been successfully broadcasted to the Nostr network.
            </p>
            <p className="text-center text-xs text-muted-foreground">
              It may take a few moments to propagate across all relays.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsBroadcasted(false)}
          >
            Broadcast Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Main component for broadcasting
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="h-5 w-5 mr-2 text-amber-500" />
          Broadcast to Nostr
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={`ml-2 text-xs ${isConnected ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
          >
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Share your offer with the Nostr decentralized network for wider reach
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {nostrError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{nostrError}</AlertDescription>
          </Alert>
        )}
        
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm">
              Connect to your Nostr identity to broadcast this offer to the decentralized Nostr network.
            </p>
            
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleConnectExtension}
              disabled={isLoading || !hasExtension}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Connect Nostr
                </>
              )}
            </Button>
            
            {!hasExtension && (
              <p className="text-xs text-muted-foreground text-center">
                No Nostr extension detected. Install{' '}
                <a 
                  href="https://getalby.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:underline"
                >
                  Alby
                </a>{' '}
                or{' '}
                <a 
                  href="https://github.com/fiatjaf/nos2x" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:underline"
                >
                  nos2x
                </a>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
              <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">Offer Preview</h3>
              <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                {offer.departure_location} → {offer.arrival_location} | {new Date(offer.flight_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-200">
                ${offer.requested_share_amount.toLocaleString()} | {offer.aircraft_model || 'Private Jet'}
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeLightningAddress" className="text-sm cursor-pointer">
                    Include Lightning Address
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow others to send you zaps
                  </p>
                </div>
                <Switch
                  id="includeLightningAddress"
                  checked={broadcastOptions.includeLightningAddress}
                  onCheckedChange={(checked) => 
                    setBroadcastOptions(prev => ({ ...prev, includeLightningAddress: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeContactInfo" className="text-sm cursor-pointer">
                    Include Contact Info
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Make your contact info visible
                  </p>
                </div>
                <Switch
                  id="includeContactInfo"
                  checked={broadcastOptions.includeContactInfo}
                  onCheckedChange={(checked) => 
                    setBroadcastOptions(prev => ({ ...prev, includeContactInfo: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="privateMode" className="text-sm cursor-pointer">
                    Private Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Limit data shared publicly
                  </p>
                </div>
                <Switch
                  id="privateMode"
                  checked={broadcastOptions.privateMode}
                  onCheckedChange={(checked) => 
                    setBroadcastOptions(prev => ({ ...prev, privateMode: checked }))
                  }
                />
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={broadcastOffer}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Broadcast to Nostr
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {relays.filter(r => r.status === 'connected').length} of {relays.length} relays connected
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 