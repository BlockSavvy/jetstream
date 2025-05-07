'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  Download, 
  Wallet, 
  RefreshCw, 
  QrCode, 
  Share2,
  FilePlus,
  FileJson,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import NostrQrCode from './NostrQrCode';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';

interface EnhancedBoardingPassButtonProps {
  offerId: string;
  transactionId?: string;
  isTestMode?: boolean;
  variant?: 'default' | 'expanded' | 'minimal';
  showQR?: boolean;
  showAppleWallet?: boolean;
  className?: string;
  flightData?: {
    flightNumber: string;
    departureLocation: string;
    arrivalLocation: string;
    departureTime: string;
    arrivalTime?: string;
    aircraft?: string;
    seat?: string;
  };
}

export default function EnhancedBoardingPassButton({
  offerId,
  transactionId,
  isTestMode = false,
  variant = 'default',
  showQR = true,
  showAppleWallet = true,
  className,
  flightData
}: EnhancedBoardingPassButtonProps) {
  const { getThemeClasses } = useGdyupTheme();
  const { isConnected } = useNostr();
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleWalletLoading, setIsAppleWalletLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isQRLoading, setIsQRLoading] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrType, setQrType] = useState<'standard' | 'nostr'>(isConnected ? 'nostr' : 'standard');
  const [isCollapsed, setIsCollapsed] = useState(variant !== 'expanded');

  // Handle PDF Download
  const downloadBoardingPass = async () => {
    setIsPdfLoading(true);
    try {
      // Log the start of PDF download 
      console.log(`Requesting boarding pass PDF for offer ${offerId}`);
      
      const response = await fetch(`/api/gdyup/boardingpass/${offerId}/pdf?${transactionId ? `transactionId=${transactionId}` : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || response.statusText;
        throw new Error(`Error generating PDF (${response.status}): ${errorMsg}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boardingpass-${offerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Boarding pass PDF downloaded');
      
      // Record successful download
      try {
        await fetch('/api/gdyup/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'boarding_pass_downloaded',
            metadata: { offerId, format: 'pdf' }
          })
        });
      } catch (activityError) {
        // Non-critical error, just log it
        console.error('Failed to record boarding pass download activity:', activityError);
      }
    } catch (error) {
      console.error('Error downloading boarding pass:', error);
      toast.error(`Failed to download boarding pass: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Handle Apple Wallet Pass
  const addToAppleWallet = async () => {
    setIsAppleWalletLoading(true);
    try {
      // Log the start of Apple Wallet pass generation
      console.log(`Requesting Apple Wallet pass for offer ${offerId}`);
      
      const response = await fetch(`/api/gdyup/boardingpass/${offerId}/pkpass?${transactionId ? `transactionId=${transactionId}` : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || response.statusText;
        throw new Error(`Error generating Apple Wallet pass (${response.status}): ${errorMsg}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdyup-boarding-${offerId}.pkpass`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Apple Wallet pass downloaded');
      
      // Record successful download
      try {
        await fetch('/api/gdyup/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'wallet_pass_downloaded',
            metadata: { offerId, format: 'pkpass' }
          })
        });
      } catch (activityError) {
        // Non-critical error, just log it
        console.error('Failed to record wallet pass download activity:', activityError);
      }
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      toast.error(`Failed to generate Apple Wallet pass: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAppleWalletLoading(false);
    }
  };

  // Handle showing QR code dialog
  const showNostrQR = () => {
    setIsQRDialogOpen(true);
  };

  // Handle saving boarding pass data as JSON
  const saveBoardingPassData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gdyup/boardingpass/${offerId}?${transactionId ? `transactionId=${transactionId}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching boarding pass data: ${response.statusText}`);
      }
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boardingpass-${offerId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Boarding pass data saved');
    } catch (error) {
      console.error('Error saving boarding pass data:', error);
      toast.error('Failed to save boarding pass data');
    } finally {
      setIsLoading(false);
    }
  };

  // Share boarding pass using Web Share API if available
  const shareBoardingPass = async () => {
    if (!navigator.share) {
      toast.error('Web Share API is not supported in your browser');
      return;
    }

    try {
      await navigator.share({
        title: 'GDY·UP Boarding Pass',
        text: `Check out my flight from ${flightData?.departureLocation || 'Origin'} to ${flightData?.arrivalLocation || 'Destination'}`,
        url: `${window.location.origin}/gdyup/boardingpass/${offerId}`
      });
      toast.success('Boarding pass shared');
    } catch (error) {
      console.error('Error sharing boarding pass:', error);
      // User might have canceled the share operation, so don't show error in that case
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Failed to share boarding pass');
      }
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (variant === 'expanded' || !isCollapsed) {
    return (
      <motion.div 
        className={cn(
          getThemeClasses({
            base: "p-4 rounded-lg border space-y-3",
            default: "bg-black/20 border-gray-800",
            blue: "bg-blue-950/20 border-blue-900",
            pink: "bg-pink-950/20 border-pink-900"
          }),
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center">
          <div className={getThemeClasses({
            base: "text-lg font-semibold",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>
            Boarding Pass Options
          </div>
          {variant !== 'expanded' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className={getThemeClasses({
                base: "p-1 h-8 w-8",
                default: "text-gray-400 hover:text-white",
                blue: "text-blue-400 hover:text-blue-100",
                pink: "text-pink-400 hover:text-pink-100"
              })}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              disabled={isPdfLoading}
              onClick={downloadBoardingPass}
              className={cn(
                "w-full justify-start",
                getThemeClasses({
                  base: "",
                  default: "border-gray-700 hover:bg-gray-800 text-white",
                  blue: "border-blue-700 hover:bg-blue-800 text-blue-100",
                  pink: "border-pink-700 hover:bg-pink-800 text-pink-100"
                })
              )}
            >
              {isPdfLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </motion.div>
          
          {showAppleWallet && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                disabled={isAppleWalletLoading}
                onClick={addToAppleWallet}
                className={cn(
                  "w-full justify-start",
                  getThemeClasses({
                    base: "",
                    default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                    blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                    pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
                  })
                )}
              >
                {isAppleWalletLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Add to Apple Wallet
                  </>
                )}
              </Button>
            </motion.div>
          )}
          
          {showQR && (
            <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      getThemeClasses({
                        base: "",
                        default: "border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary",
                        blue: "border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary",
                        pink: "border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary"
                      })
                    )}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR Code
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className={getThemeClasses({
                base: "sm:max-w-md",
                default: "bg-gray-900 border-gray-800",
                blue: "bg-blue-950 border-blue-900",
                pink: "bg-pink-950 border-pink-900"
              })}>
                <Tabs defaultValue={qrType} onValueChange={(value) => setQrType(value as 'standard' | 'nostr')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standard">Standard QR</TabsTrigger>
                    <TabsTrigger value="nostr" disabled={!isConnected}>Nostr QR</TabsTrigger>
                  </TabsList>
                  <TabsContent value="standard" className="mt-4">
                    <NostrQrCode 
                      flightData={{
                        id: offerId,
                        departureLocation: flightData?.departureLocation || 'Origin',
                        arrivalLocation: flightData?.arrivalLocation || 'Destination',
                        departureTime: flightData?.departureTime || new Date().toISOString(),
                        flightNumber: flightData?.flightNumber || `GDY-${offerId.substring(0, 4)}`,
                        aircraft: flightData?.aircraft,
                        seat: flightData?.seat
                      }}
                      qrType="standard"
                    />
                  </TabsContent>
                  <TabsContent value="nostr" className="mt-4">
                    <NostrQrCode 
                      flightData={{
                        id: offerId,
                        departureLocation: flightData?.departureLocation || 'Origin',
                        arrivalLocation: flightData?.arrivalLocation || 'Destination',
                        departureTime: flightData?.departureTime || new Date().toISOString(),
                        flightNumber: flightData?.flightNumber || `GDY-${offerId.substring(0, 4)}`,
                        aircraft: flightData?.aircraft,
                        seat: flightData?.seat
                      }}
                      qrType="nostr"
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={saveBoardingPassData}
              className={cn(
                "w-full justify-start",
                getThemeClasses({
                  base: "",
                  default: "border-gray-700 hover:bg-gray-800 text-white",
                  blue: "border-blue-700 hover:bg-blue-800 text-blue-100",
                  pink: "border-pink-700 hover:bg-pink-800 text-pink-100"
                })
              )}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileJson className="h-4 w-4 mr-2" />
                  Save JSON Data
                </>
              )}
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              onClick={shareBoardingPass}
              className={cn(
                "w-full justify-start",
                getThemeClasses({
                  base: "",
                  default: "border-gray-700 hover:bg-gray-800 text-white",
                  blue: "border-blue-700 hover:bg-blue-800 text-blue-100",
                  pink: "border-pink-700 hover:bg-pink-800 text-pink-100"
                })
              )}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Pass
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Default variant or collapsed view
  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCollapse}
        className={getThemeClasses({
          base: "p-1 h-8 w-8",
          default: "text-gray-400 hover:text-white",
          blue: "text-blue-400 hover:text-blue-100",
          pink: "text-pink-400 hover:text-pink-100"
        })}
      >
        <PanelLeftClose className="h-4 w-4" />
      </Button>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          disabled={isPdfLoading}
          onClick={downloadBoardingPass}
          className={getThemeClasses({
            base: "text-sm",
            default: "border-gray-700 hover:bg-gray-800 hover:text-gdyup-primary",
            blue: "border-blue-700 hover:bg-blue-800 hover:text-gdyup-primary",
            pink: "border-pink-700 hover:bg-pink-800 hover:text-gdyup-primary"
          })}
        >
          {isPdfLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Ticket className="h-4 w-4 mr-2" />
              Boarding Pass
            </>
          )}
        </Button>
      </motion.div>
      
      {showAppleWallet && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            disabled={isAppleWalletLoading}
            onClick={addToAppleWallet}
            className={getThemeClasses({
              base: "text-sm",
              default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
            })}
          >
            {isAppleWalletLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Add to Wallet
              </>
            )}
          </Button>
        </motion.div>
      )}
      
      {showQR && (
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className={getThemeClasses({
                  base: "text-sm",
                  default: "border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary",
                  blue: "border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary",
                  pink: "border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary"
                })}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className={getThemeClasses({
            base: "sm:max-w-md",
            default: "bg-gray-900 border-gray-800",
            blue: "bg-blue-950 border-blue-900",
            pink: "bg-pink-950 border-pink-900"
          })}>
            <Tabs defaultValue={qrType} onValueChange={(value) => setQrType(value as 'standard' | 'nostr')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Standard QR</TabsTrigger>
                <TabsTrigger value="nostr" disabled={!isConnected}>Nostr QR</TabsTrigger>
              </TabsList>
              <TabsContent value="standard" className="mt-4">
                <NostrQrCode 
                  flightData={{
                    id: offerId,
                    departureLocation: flightData?.departureLocation || 'Origin',
                    arrivalLocation: flightData?.arrivalLocation || 'Destination',
                    departureTime: flightData?.departureTime || new Date().toISOString(),
                    flightNumber: flightData?.flightNumber || `GDY-${offerId.substring(0, 4)}`,
                    aircraft: flightData?.aircraft,
                    seat: flightData?.seat
                  }}
                  qrType="standard"
                />
              </TabsContent>
              <TabsContent value="nostr" className="mt-4">
                <NostrQrCode 
                  flightData={{
                    id: offerId,
                    departureLocation: flightData?.departureLocation || 'Origin',
                    arrivalLocation: flightData?.arrivalLocation || 'Destination',
                    departureTime: flightData?.departureTime || new Date().toISOString(),
                    flightNumber: flightData?.flightNumber || `GDY-${offerId.substring(0, 4)}`,
                    aircraft: flightData?.aircraft,
                    seat: flightData?.seat
                  }}
                  qrType="nostr"
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 