'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, Plane, ArrowLeft, QrCode, Ticket, Wallet, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import BoardingPassButton from '@/app/gdyup/components/BoardingPassButton';
import NostrVerificationBadge from '@/app/gdyup/components/NostrVerificationBadge';
import TicketCheckIn from '@/app/gdyup/components/TicketCheckIn';
import NostrZapButton from '@/app/gdyup/components/NostrZapButton';
import NostrRelayStatus from '@/app/gdyup/components/NostrRelayStatus';
import NostrCommunityChat from '@/app/gdyup/components/NostrCommunityChat';
import { cn } from '@/lib/utils';
import { use } from 'react';

interface BoardingPassPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BoardingPassPage({ params }: BoardingPassPageProps) {
  // Unwrap params
  const { id } = use(params);
  
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerData, setOfferData] = useState<any>(null);
  const [boardingPassData, setBoardingPassData] = useState<any>(null);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses, theme } = useGdyupTheme();
  const [qrType, setQrType] = useState<'standard' | 'nostr'>('standard');
  const [showNostrInfo, setShowNostrInfo] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'pending' | 'available' | 'completed' | 'expired'>('pending');
  const [totalZaps, setTotalZaps] = useState(0);
  const [totalZapAmount, setTotalZapAmount] = useState(0);
  const [qrError, setQrError] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch boarding pass data
        const response = await fetch(`/api/gdyup/boardingpass/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load boarding pass');
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setOfferData(data.offer);
        setBoardingPassData(data.boarding_pass);
        
        // Determine check-in status based on flight date
        if (data.offer && data.offer.flight_date) {
          const flightDate = new Date(data.offer.flight_date);
          const now = new Date();
          const threeDaysBeforeFlight = new Date(flightDate);
          threeDaysBeforeFlight.setDate(flightDate.getDate() - 3);
          
          if (now > flightDate) {
            setCheckInStatus('expired');
          } else if (now >= threeDaysBeforeFlight) {
            setCheckInStatus('available');
          } else {
            setCheckInStatus('pending');
          }
        }
      } catch (err) {
        console.error('Error fetching boarding pass:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleGoBack = () => {
    router.push('/gdyup/dashboard');
  };
  
  const getQrCodeUrl = () => {
    if (qrType === 'nostr') {
      return `/api/gdyup/boardingpass/${id}/qr?type=nostr&t=${Date.now()}`;
    }
    return `/api/gdyup/boardingpass/${id}/qr?t=${Date.now()}`;
  };
  
  const handleSaveToFiles = async () => {
    setIsDownloading(true);
    
    try {
      // Fetch the boarding pass PDF
      const response = await fetch(`/api/gdyup/boardingpass/${id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `boarding-pass-${id}.pdf`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      toast.success('Boarding pass saved successfully!');
    } catch (error) {
      console.error('Error saving boarding pass:', error);
      toast.error('Failed to save boarding pass');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleAddToWallet = async () => {
    setIsWalletProcessing(true);
    
    try {
      // Fetch the Apple Wallet pass
      const response = await fetch(`/api/gdyup/boardingpass/${id}/pkpass`);
      
      if (!response.ok) {
        throw new Error('Failed to generate wallet pass');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `boarding-pass-${id}.pkpass`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      toast.success('Added to wallet successfully!');
    } catch (error) {
      console.error('Error adding to wallet:', error);
      toast.error('Failed to add to wallet');
    } finally {
      setIsWalletProcessing(false);
    }
  };
  
  const handleShareBoardingPass = () => {
    if (navigator.share) {
      navigator.share({
        title: 'GDY·UP Boarding Pass',
        text: 'Check out my boarding pass for my upcoming private jet flight!',
        url: window.location.href,
      })
      .then(() => toast.success('Boarding pass shared successfully!'))
      .catch((error) => {
        console.error('Error sharing:', error);
        toast.error('Failed to share boarding pass');
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Boarding pass link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };
  
  const renderQrCodeOptions = () => {
    return (
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={qrType === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQrType('standard')}
          className={cn(
            "text-xs py-1 h-8",
            qrType === 'standard' ? getThemedButtonClasses('primary') : getThemedTextClasses()
          )}
        >
          Standard QR
        </Button>
        <Button
          variant={qrType === 'nostr' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setQrType('nostr');
            setShowNostrInfo(true);
          }}
          className={cn(
            "text-xs py-1 h-8",
            qrType === 'nostr' ? getThemedButtonClasses('secondary') : getThemedTextClasses()
          )}
        >
          Nostr QR
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNostrInfo(!showNostrInfo)}
          className={cn("text-xs py-1 h-8", getThemedTextClasses('muted'))}
        >
          ?
        </Button>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <Loader2 className={cn(
            "h-12 w-12 animate-spin mb-4",
            "text-gdyup-primary"
          )} />
          <p className={getThemedTextClasses()}>Loading your boarding pass...</p>
        </motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[50vh]"
      >
        <div className={cn(
          "p-4 rounded-lg border text-center max-w-md",
          "bg-red-950/30 border-red-900 text-red-300"
        )}>
          <p className="mb-4">{error}</p>
          <Button 
            onClick={handleGoBack}
            className={getThemedButtonClasses('primary')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }
  
  if (!offerData || !boardingPassData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className={getThemedTextClasses()}>No boarding pass data available.</p>
        <Button 
          onClick={handleGoBack} 
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="mb-6 flex items-center"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className={cn("mr-2", getThemedTextClasses())}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
        <h1 className={cn("text-2xl font-bold", getThemedTextClasses())}>
          Boarding Pass
        </h1>
      </motion.div>
      
      <motion.div 
        className="max-w-lg mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={cn(
          "overflow-hidden border shadow-lg",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <CardHeader className={cn(
            "relative pb-2",
            getThemedBackgroundClasses('card'),
            "bg-opacity-40"
          )}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={cn("text-lg font-bold", getThemedTextClasses())}>
                  GDY·UP
                </h2>
                <p className={getThemedTextClasses('muted')}>
                  Private Jet Boarding Pass
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NostrRelayStatus 
                  size="sm"
                  isConnected={true}
                />
                <NostrVerificationBadge 
                  nip05={user?.user_metadata?.nip05 || null}
                  isVerified={true}
                  size="sm"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={cn("pt-6 space-y-6", getThemedTextClasses())}>
            <div className="flex justify-between items-center">
              <div>
                <p className={getThemedTextClasses('muted') + " text-xs uppercase"}>
                  Passenger
                </p>
                <p className="font-medium text-lg">
                  {user?.user_metadata?.full_name || 'Guest User'}
                </p>
              </div>
              <div>
                <p className={getThemedTextClasses('muted') + " text-xs uppercase"}>
                  Flight Date
                </p>
                <p className="font-medium">
                  {format(new Date(offerData.flight_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className={cn(
              "flex items-center justify-between p-4 rounded-lg",
              getThemedBackgroundClasses('card'),
              "border border-gdyup-border"
            )}>
              <div className="text-center">
                <p className={getThemedTextClasses('muted') + " text-xs uppercase"}>
                  From
                </p>
                <p className="font-bold text-xl">{offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase()}</p>
                <p className="text-xs mt-1">{offerData.departure_location}</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center px-4">
                <div className={cn("h-0.5 flex-1", "bg-gdyup-border")}></div>
                <Plane className="mx-2 h-5 w-5 flex-shrink-0 text-gdyup-primary" />
                <div className={cn("h-0.5 flex-1", "bg-gdyup-border")}></div>
              </div>
              
              <div className="text-center">
                <p className={getThemedTextClasses('muted') + " text-xs uppercase"}>
                  To
                </p>
                <p className="font-bold text-xl">{offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase()}</p>
                <p className="text-xs mt-1">{offerData.arrival_location}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={getThemedTextClasses('muted') + " text-xs uppercase"}>
                  Seat
                </p>
                <p className="font-medium">
                  {boardingPassData.seat || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className={getThemedTextClasses('muted') + " text-xs uppercase"}>
                  Aircraft
                </p>
                <p className="font-medium">
                  {offerData.aircraft_type || 'Private Jet'}
                </p>
              </div>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg text-center",
              getThemedBackgroundClasses('card'),
              "border border-gdyup-border"
            )}>
              <p className={getThemedTextClasses('muted') + " text-xs uppercase mb-1"}>
                Check-in Instructions
              </p>
              <p className="text-sm">
                Please arrive at the FBO terminal 30 minutes before departure. Present this boarding pass and a valid ID.
              </p>
            </div>
            
            <motion.div
              className="mt-8 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <BoardingPassButton 
                offerId={id} 
                variant="expanded"
                showQR={true}
              />
            </motion.div>
            
            <div className="mb-6 flex flex-col items-center">
              <h3 className={cn("text-lg font-medium mb-2", getThemedTextClasses())}>Boarding Pass QR Code</h3>
              
              {renderQrCodeOptions()}
              
              <AnimatePresence>
                {showNostrInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "text-xs p-3 rounded-md mb-4 max-w-xs text-center",
                      getThemedBackgroundClasses('card'),
                      getThemedTextClasses('muted'),
                      "border border-gdyup-border"
                    )}
                  >
                    Nostr QR codes contain cryptographically verifiable boarding pass data that can be validated by any Nostr-compatible scanner without requiring a central server.
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className="p-4 rounded-xl bg-white"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {isQrLoading && !qrError && (
                  <div className="flex items-center justify-center h-[200px] w-[200px]">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                  </div>
                )}
                <img
                  src={getQrCodeUrl()}
                  alt="Boarding Pass QR Code"
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg"
                  onError={() => {
                    setQrError(true);
                    setIsQrLoading(false);
                  }}
                  onLoad={() => setIsQrLoading(false)}
                  style={{ display: isQrLoading || qrError ? 'none' : 'block' }}
                />
                {qrError && (
                  <div className="flex flex-col items-center justify-center h-[200px] w-[200px]">
                    <QrCode className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm text-center">QR code not available</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setQrError(false);
                        setIsQrLoading(true);
                      }}
                      className="mt-2 text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </motion.div>
              
              <p className={getThemedTextClasses('muted') + " mt-2 text-sm"}>
                {qrType === 'nostr' ? 'Nostr-compatible boarding pass' : 'Standard boarding pass'}
              </p>
              
              <p className={getThemedTextClasses('muted') + " mt-1 text-xs font-mono opacity-70"}>
                {boardingPassData.ticket_code}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToFiles}
                disabled={isDownloading}
                className="text-xs border-gdyup-border"
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save PDF
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToWallet}
                disabled={isWalletProcessing}
                className="text-xs border-gdyup-border"
              >
                {isWalletProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Wallet className="h-3 w-3 mr-1" />
                )}
                Add to Wallet
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareBoardingPass}
                className="text-xs border-gdyup-border"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
              
              <NostrZapButton 
                size="sm"
                recipientNip05={user?.user_metadata?.nip05 || 'pilot@gdyup.com'}
                amount={5000}
                showAmount={false}
                onSuccess={(amount) => {
                  setTotalZaps(prev => prev + 1);
                  setTotalZapAmount(prev => prev + amount);
                  toast.success(`Thank you for your ${amount} sats tip to the pilot!`, {
                    duration: 5000,
                  });
                }}
              />
            </div>
            
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <TicketCheckIn 
                flightDate={offerData.flight_date}
                departureLocation={offerData.departure_location}
                checkInStatus={checkInStatus}
                onCheckIn={async () => {
                  try {
                    // In a real implementation, this would call an API to check in
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    toast.success('Successfully checked in for your flight!');
                    setCheckInStatus('completed');
                    return true;
                  } catch (error) {
                    toast.error('Failed to check in. Please try again later.');
                    return false;
                  }
                }}
              />
            </motion.div>
            
            {totalZaps > 0 && (
              <motion.div
                className="mt-4 p-3 rounded-lg text-center bg-amber-900/20 border border-amber-800 text-amber-400"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-sm">
                  <span className="font-bold">{totalZaps}</span> {totalZaps === 1 ? 'zap' : 'zaps'} sent for a total of <span className="font-bold">{totalZapAmount.toLocaleString()}</span> sats
                </p>
              </motion.div>
            )}
            
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <NostrCommunityChat 
                flightId={id}
                flightName={`${offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase()} to ${offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase()}`}
                initialCollapsed={true}
              />
            </motion.div>
          </CardContent>
          
          <CardFooter className="relative z-10 pt-0 text-center justify-center">
            <p className={getThemedTextClasses('muted') + " text-xs opacity-70"}>
              GDY·UP Jet Services • {format(new Date(), 'yyyy')} • Boarding Pass #{boardingPassData?.id?.substring(0, 8) || '00000000'}
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
} 