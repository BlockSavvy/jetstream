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

interface BoardingPassPageProps {
  params: {
    id: string;
  };
}

export default function BoardingPassPage({ params }: BoardingPassPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerData, setOfferData] = useState<any>(null);
  const [boardingPassData, setBoardingPassData] = useState<any>(null);
  const { getThemeClasses, theme } = useGdyupTheme();
  const [qrType, setQrType] = useState<'standard' | 'nostr'>('standard');
  const [showNostrInfo, setShowNostrInfo] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'pending' | 'available' | 'completed' | 'expired'>('pending');
  const [totalZaps, setTotalZaps] = useState(0);
  const [totalZapAmount, setTotalZapAmount] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch boarding pass data
        const response = await fetch(`/api/boardingpass/${params.id}`);
        
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
  }, [params.id]);
  
  const handleGoBack = () => {
    router.push('/gdyup/dashboard');
  };
  
  const getQrCodeUrl = () => {
    // In a real implementation, these would be different URLs
    if (qrType === 'nostr') {
      return `/api/boardingpass/${params.id}/qr?type=nostr&t=${Date.now()}`;
    }
    return `/api/boardingpass/${params.id}/qr?t=${Date.now()}`;
  };
  
  const handleSaveToFiles = async () => {
    setIsDownloading(true);
    
    try {
      // Fetch the boarding pass PDF
      const response = await fetch(`/api/boardingpass/${params.id}?format=pdf`);
      
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
      link.download = `boarding-pass-${params.id}.pdf`;
      
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
      const response = await fetch(`/api/boardingpass/${params.id}?format=pkpass`);
      
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
      link.download = `boarding-pass-${params.id}.pkpass`;
      
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
          className={getThemeClasses({
            base: "text-xs py-1 h-8",
            default: qrType === 'standard' ? 'bg-gdyup-primary text-black hover:bg-gdyup-primary/90' : 'text-white',
            blue: qrType === 'standard' ? 'bg-gdyup-primary text-white hover:bg-gdyup-primary/90' : 'text-blue-100',
            pink: qrType === 'standard' ? 'bg-gdyup-primary text-white hover:bg-gdyup-primary/90' : 'text-pink-100'
          })}
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
          className={getThemeClasses({
            base: "text-xs py-1 h-8",
            default: qrType === 'nostr' ? 'bg-gdyup-secondary text-white hover:bg-gdyup-secondary/90' : 'text-white',
            blue: qrType === 'nostr' ? 'bg-gdyup-secondary text-white hover:bg-gdyup-secondary/90' : 'text-blue-100',
            pink: qrType === 'nostr' ? 'bg-gdyup-secondary text-white hover:bg-gdyup-secondary/90' : 'text-pink-100'
          })}
        >
          Nostr QR
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNostrInfo(!showNostrInfo)}
          className={getThemeClasses({
            base: "text-xs py-1 h-8",
            default: "text-gray-400",
            blue: "text-blue-400",
            pink: "text-pink-400"
          })}
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
            getThemeClasses({
              base: "",
              default: "text-gdyup-primary",
              blue: "text-gdyup-primary",
              pink: "text-gdyup-primary"
            })
          )} />
          <p className={getThemeClasses({
            base: "text-lg",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>Loading your boarding pass...</p>
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
        <div className={getThemeClasses({
          base: "p-4 rounded-lg border text-center max-w-md",
          default: "bg-red-950/30 border-red-900 text-red-300",
          blue: "bg-red-950/20 border-red-800 text-red-300",
          pink: "bg-red-950/20 border-red-800 text-red-300"
        })}>
          <p className="mb-4">{error}</p>
          <Button 
            onClick={handleGoBack}
            className={getThemeClasses({
              base: "",
              default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
            })}
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
        <p className={getThemeClasses({
          base: "text-lg",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>No boarding pass data available.</p>
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
          className={getThemeClasses({
            base: "mr-2",
            default: "text-white hover:text-gdyup-primary",
            blue: "text-blue-100 hover:text-gdyup-primary",
            pink: "text-pink-100 hover:text-gdyup-primary"
          })}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
        <h1 className={getThemeClasses({
          base: "text-2xl font-bold",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>
          Boarding Pass
        </h1>
      </motion.div>
      
      <motion.div 
        className="max-w-lg mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={getThemeClasses({
          base: "overflow-hidden border shadow-lg",
          default: "bg-gray-900/90 border-gray-800",
          blue: "bg-blue-950/90 border-blue-900",
          pink: "bg-pink-950/90 border-pink-900"
        })}>
          <CardHeader className={getThemeClasses({
            base: "relative pb-2",
            default: "bg-black/40",
            blue: "bg-blue-950/40",
            pink: "bg-pink-950/40"
          })}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={getThemeClasses({
                  base: "text-lg font-bold",
                  default: "text-white",
                  blue: "text-blue-100",
                  pink: "text-pink-100"
                })}>
                  GDY·UP
                </h2>
                <p className={getThemeClasses({
                  base: "text-sm",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
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
          
          <CardContent className={getThemeClasses({
            base: "pt-6 space-y-6",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>
            <div className="flex justify-between items-center">
              <div>
                <p className={getThemeClasses({
                  base: "text-xs uppercase",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  Passenger
                </p>
                <p className="font-medium text-lg">
                  {user?.user_metadata?.full_name || 'Guest User'}
                </p>
              </div>
              <div>
                <p className={getThemeClasses({
                  base: "text-xs uppercase",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  Flight Date
                </p>
                <p className="font-medium">
                  {format(new Date(offerData.flight_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className={getThemeClasses({
              base: "flex items-center justify-between p-4 rounded-lg",
              default: "bg-black/30 border border-gray-800",
              blue: "bg-blue-950/30 border border-blue-900",
              pink: "bg-pink-950/30 border border-pink-900"
            })}>
              <div className="text-center">
                <p className={getThemeClasses({
                  base: "text-xs uppercase",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  From
                </p>
                <p className="font-bold text-xl">{offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase()}</p>
                <p className="text-xs mt-1">{offerData.departure_location}</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center px-4">
                <div className={getThemeClasses({
                  base: "h-0.5 flex-1",
                  default: "bg-gray-700",
                  blue: "bg-blue-700",
                  pink: "bg-pink-700"
                })}></div>
                <Plane className={cn(
                  "mx-2 h-5 w-5 flex-shrink-0",
                  getThemeClasses({
                    base: "",
                    default: "text-gdyup-primary",
                    blue: "text-gdyup-primary",
                    pink: "text-gdyup-primary"
                  })
                )} />
                <div className={getThemeClasses({
                  base: "h-0.5 flex-1",
                  default: "bg-gray-700",
                  blue: "bg-blue-700",
                  pink: "bg-pink-700"
                })}></div>
              </div>
              
              <div className="text-center">
                <p className={getThemeClasses({
                  base: "text-xs uppercase",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  To
                </p>
                <p className="font-bold text-xl">{offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase()}</p>
                <p className="text-xs mt-1">{offerData.arrival_location}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={getThemeClasses({
                  base: "text-xs uppercase",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  Seat
                </p>
                <p className="font-medium">
                  {boardingPassData.seat || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className={getThemeClasses({
                  base: "text-xs uppercase",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>
                  Aircraft
                </p>
                <p className="font-medium">
                  {offerData.aircraft_type || 'Private Jet'}
                </p>
              </div>
            </div>
            
            <div className={getThemeClasses({
              base: "p-3 rounded-lg text-center",
              default: "bg-black/30 border border-gray-800",
              blue: "bg-blue-950/30 border border-blue-900",
              pink: "bg-pink-950/30 border border-pink-900"
            })}>
              <p className={getThemeClasses({
                base: "text-xs uppercase mb-1",
                default: "text-gray-400",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>
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
                offerId={params.id} 
                variant="expanded"
                showQR={true}
              />
            </motion.div>
            
            <div className="mb-6 flex flex-col items-center">
              <h3 className={getThemeClasses({
                base: "text-lg font-medium mb-2",
                default: "text-white",
                blue: "text-blue-100",
                pink: "text-pink-100"
              })}>Boarding Pass QR Code</h3>
              
              {renderQrCodeOptions()}
              
              <AnimatePresence>
                {showNostrInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={getThemeClasses({
                      base: "text-xs p-3 rounded-md mb-4 max-w-xs text-center",
                      default: "bg-gray-800/70 text-gray-300 border border-gray-700",
                      blue: "bg-blue-950/70 text-blue-200 border border-blue-900/50",
                      pink: "bg-pink-950/70 text-pink-200 border border-pink-900/50"
                    })}
                  >
                    Nostr QR codes contain cryptographically verifiable boarding pass data that can be validated by any Nostr-compatible scanner without requiring a central server.
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className={getThemeClasses({
                  base: "p-4 rounded-xl",
                  default: "bg-white",
                  blue: "bg-white",
                  pink: "bg-white"
                })}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <Image
                  src={getQrCodeUrl()}
                  alt="Boarding Pass QR Code"
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg"
                />
              </motion.div>
              
              <p className={getThemeClasses({
                base: "mt-2 text-sm",
                default: "text-gray-400",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>
                {qrType === 'nostr' ? 'Nostr-compatible boarding pass' : 'Standard boarding pass'}
              </p>
              
              <p className={getThemeClasses({
                base: "mt-1 text-xs font-mono",
                default: "text-gray-500",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                {boardingPassData.ticket_code}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToFiles}
                disabled={isDownloading}
                className={getThemeClasses({
                  base: "text-xs",
                  default: "border-gray-700 hover:bg-gray-800",
                  blue: "border-blue-700 hover:bg-blue-900",
                  pink: "border-pink-700 hover:bg-pink-900"
                })}
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
                className={getThemeClasses({
                  base: "text-xs",
                  default: "border-gray-700 hover:bg-gray-800",
                  blue: "border-blue-700 hover:bg-blue-900",
                  pink: "border-pink-700 hover:bg-pink-900"
                })}
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
                className={getThemeClasses({
                  base: "text-xs",
                  default: "border-gray-700 hover:bg-gray-800",
                  blue: "border-blue-700 hover:bg-blue-900",
                  pink: "border-pink-700 hover:bg-pink-900"
                })}
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
                className={getThemeClasses({
                  base: "mt-4 p-3 rounded-lg text-center",
                  default: "bg-amber-900/20 border border-amber-800",
                  blue: "bg-amber-900/20 border border-amber-800",
                  pink: "bg-amber-900/20 border border-amber-800"
                })}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className={getThemeClasses({
                  base: "text-sm",
                  default: "text-amber-400",
                  blue: "text-amber-400",
                  pink: "text-amber-400"
                })}>
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
                flightId={params.id}
                flightName={`${offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase()} to ${offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase()}`}
                initialCollapsed={true}
              />
            </motion.div>
          </CardContent>
          
          <CardFooter className="relative z-10 pt-0 text-center justify-center">
            <p className={getThemeClasses({
              base: "text-xs",
              default: "text-gray-500",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              GDY·UP Jet Services • {format(new Date(), 'yyyy')} • Boarding Pass #{boardingPassData?.id?.substring(0, 8) || '00000000'}
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
} 