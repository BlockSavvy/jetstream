'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plane, Calendar, AlertCircle, Download, ArrowLeft, QrCode, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';
import BoardingPassButton from '../../components/BoardingPassButton';
import Image from 'next/image';

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
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        if (!user) {
          // If no user, redirect to login
          router.push(`/auth/login?returnUrl=${encodeURIComponent(`/gdyup/boardingpass/${params.id}`)}`);
          return;
        }
        
        const supabase = createClient();
        
        // First fetch the offer
        const { data: offer, error: offerError } = await supabase
          .from('jetshare_offers')
          .select(`
            *,
            user:user_id (*),
            matched_user:matched_user_id (*)
          `)
          .eq('id', params.id)
          .single();
          
        if (offerError || !offer) {
          throw new Error('Offer not found');
        }
        
        // Check if the user has access to this offer
        if (offer.user_id !== user.id && offer.matched_user_id !== user.id) {
          throw new Error('You do not have access to this boarding pass');
        }
        
        // Check if the offer is paid
        if (offer.status !== 'completed' && offer.status !== 'paid' && offer.payment_status !== 'paid') {
          throw new Error('Booking is not complete - payment required');
        }
        
        setOfferData(offer);
        
        // Check if there's a boarding pass already
        const { data: boardingPass, error: boardingPassError } = await supabase
          .from('jetshare_tickets')
          .select('*')
          .eq('offer_id', params.id)
          .eq('user_id', user.id)
          .single();
          
        if (boardingPass) {
          setBoardingPassData(boardingPass);
        } else {
          // Generate a boarding pass
          // In a real app, this would be a more complex process with seat assignment
          const seatNumber = user.id === offer.user_id ? '1A' : '1B';
          const ticketCode = `JS-${Math.floor(1000 + Math.random() * 9000)}`;
          
          const newBoardingPass = {
            offer_id: params.id,
            user_id: user.id,
            passenger_name: user.user_metadata?.full_name || 'GDY·UP Traveler',
            ticket_code: ticketCode,
            seat_number: seatNumber,
            boarding_time: new Date(offer.flight_date).toISOString(),
            gate: `A${Math.floor(1 + Math.random() * 20)}`,
            status: 'active',
            created_at: new Date().toISOString(),
            metadata: {
              departure_location: offer.departure_location,
              arrival_location: offer.arrival_location,
              flight_date: offer.flight_date,
              aircraft_model: offer.aircraft_model
            }
          };
          
          const { data: insertedPass, error: insertError } = await supabase
            .from('jetshare_tickets')
            .insert([newBoardingPass])
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating boarding pass:', insertError);
            // Continue with the data we have
            setBoardingPassData(newBoardingPass);
          } else {
            setBoardingPassData(insertedPass);
          }
        }
        
      } catch (error) {
        console.error('Error loading boarding pass:', error);
        setError(error instanceof Error ? error.message : 'Failed to load boarding pass');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, router, user]);
  
  const handleGoBack = () => {
    router.push('/gdyup/dashboard');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={getThemeClasses({
          base: "border shadow-md",
          default: "bg-gray-900/90 border-gray-800",
          blue: "bg-blue-950/90 border-blue-900",
          pink: "bg-pink-950/90 border-pink-900"
        })}>
          <CardHeader>
            <CardTitle className={getThemeClasses({
              base: "text-center",
              default: "text-white",
              blue: "text-blue-100",
              pink: "text-pink-100"
            })}>Loading Boarding Pass...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <Loader2 className={getThemeClasses({
                base: "h-12 w-12 animate-spin",
                default: "text-amber-500",
                blue: "text-amber-400",
                pink: "text-amber-300"
              })} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !offerData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={getThemeClasses({
          base: "border shadow-md",
          default: "bg-gray-900/90 border-gray-800",
          blue: "bg-blue-950/90 border-blue-900",
          pink: "bg-pink-950/90 border-pink-900"
        })}>
          <CardHeader className="text-center">
            <AlertCircle className={getThemeClasses({
              base: "h-10 w-10 mx-auto mb-4",
              default: "text-red-500",
              blue: "text-red-400",
              pink: "text-red-400"
            })} />
            <CardTitle className={getThemeClasses({
              base: "",
              default: "text-white",
              blue: "text-blue-100",
              pink: "text-pink-100"
            })}>Error Loading Boarding Pass</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={getThemeClasses({
              base: "text-center mb-4",
              default: "text-gray-300",
              blue: "text-blue-200",
              pink: "text-pink-200"
            })}>{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className={getThemeClasses({
                base: "w-full",
                default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
                blue: "bg-blue-500 hover:bg-blue-600 text-white",
                pink: "bg-pink-500 hover:bg-pink-600 text-white"
              })}
              onClick={handleGoBack}
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button 
        variant="ghost" 
        className={getThemeClasses({
          base: "mb-6 p-0",
          default: "text-white hover:text-[#DAFF0D] hover:bg-transparent",
          blue: "text-blue-100 hover:text-blue-300 hover:bg-transparent",
          pink: "text-pink-100 hover:text-pink-300 hover:bg-transparent"
        })}
        onClick={handleGoBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className={getThemeClasses({
          base: "border-2 overflow-hidden relative",
          default: "bg-gradient-to-b from-gray-900 to-black border-amber-600/20",
          blue: "bg-gradient-to-b from-blue-950 to-blue-900 border-amber-500/20",
          pink: "bg-gradient-to-b from-pink-950 to-pink-900 border-amber-500/20"
        })}>
          <div className={getThemeClasses({
            base: "h-1.5 w-full",
            default: "bg-amber-500",
            blue: "bg-amber-400",
            pink: "bg-amber-400"
          })}></div>
          
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mt-10 -mr-10 z-0"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full -mb-16 -ml-16 z-0"></div>
          
          <CardHeader className="relative z-10 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className={getThemeClasses({
                  base: "text-xl font-bold",
                  default: "text-white",
                  blue: "text-blue-100",
                  pink: "text-pink-100"
                })}>Boarding Pass</CardTitle>
                <p className={getThemeClasses({
                  base: "text-sm",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>GDY·UP Private Jet</p>
              </div>
              <Plane className={getThemeClasses({
                base: "h-8 w-8",
                default: "text-amber-500",
                blue: "text-amber-400",
                pink: "text-amber-400"
              })} />
            </div>
            
            <div className="mt-4 text-center">
              <motion.p 
                className={getThemeClasses({
                  base: "text-3xl font-bold tracking-wide",
                  default: "text-amber-600",
                  blue: "text-amber-500",
                  pink: "text-amber-500"
                })}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {boardingPassData?.ticket_code || 'GDY-0000'}
              </motion.p>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 pb-0">
            <div className="mb-6">
              <div className="flex items-center justify-between my-6">
                <div className="text-center">
                  <p className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-400",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>From</p>
                  <p className={getThemeClasses({
                    base: "text-lg font-semibold",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>{offerData.departure_location}</p>
                </div>
                
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className={getThemeClasses({
                    base: "w-full border-t border-dashed",
                    default: "border-amber-700/50",
                    blue: "border-amber-600/50",
                    pink: "border-amber-600/50"
                  })}></div>
                  <Plane className={getThemeClasses({
                    base: "mx-2 h-4 w-4 transform rotate-90",
                    default: "text-amber-500",
                    blue: "text-amber-400",
                    pink: "text-amber-400"
                  })} />
                  <div className={getThemeClasses({
                    base: "w-full border-t border-dashed",
                    default: "border-amber-700/50",
                    blue: "border-amber-600/50",
                    pink: "border-amber-600/50"
                  })}></div>
                </div>
                
                <div className="text-center">
                  <p className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-400",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>To</p>
                  <p className={getThemeClasses({
                    base: "text-lg font-semibold",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>{offerData.arrival_location}</p>
                </div>
              </div>
              
              <div className={getThemeClasses({
                base: "h-px my-6",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })}></div>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="flex items-center mb-1">
                    <Calendar className={getThemeClasses({
                      base: "h-4 w-4 mr-2",
                      default: "text-amber-500",
                      blue: "text-amber-400",
                      pink: "text-amber-400"
                    })} />
                    <p className={getThemeClasses({
                      base: "text-sm",
                      default: "text-gray-400",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>Date</p>
                  </div>
                  <p className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>{format(new Date(offerData.flight_date), 'MMM d, yyyy')}</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <Clock className={getThemeClasses({
                      base: "h-4 w-4 mr-2",
                      default: "text-amber-500",
                      blue: "text-amber-400",
                      pink: "text-amber-400"
                    })} />
                    <p className={getThemeClasses({
                      base: "text-sm",
                      default: "text-gray-400",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>Departure Time</p>
                  </div>
                  <p className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>{format(new Date(offerData.flight_date), 'h:mm a')}</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <MapPin className={getThemeClasses({
                      base: "h-4 w-4 mr-2",
                      default: "text-amber-500",
                      blue: "text-amber-400",
                      pink: "text-amber-400"
                    })} />
                    <p className={getThemeClasses({
                      base: "text-sm",
                      default: "text-gray-400",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>Gate</p>
                  </div>
                  <p className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>{boardingPassData?.gate || 'A1'}</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <MapPin className={getThemeClasses({
                      base: "h-4 w-4 mr-2",
                      default: "text-amber-500",
                      blue: "text-amber-400",
                      pink: "text-amber-400"
                    })} />
                    <p className={getThemeClasses({
                      base: "text-sm",
                      default: "text-gray-400",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>Seat</p>
                  </div>
                  <p className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>{boardingPassData?.seat_number || 'TBD'}</p>
                </div>
              </div>
              
              <div className={getThemeClasses({
                base: "h-px my-6",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })}></div>
              
              <div className="flex flex-col items-center">
                <p className={getThemeClasses({
                  base: "text-sm mb-1",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Passenger</p>
                <p className={getThemeClasses({
                  base: "text-lg font-bold",
                  default: "text-white",
                  blue: "text-blue-100",
                  pink: "text-pink-100"
                })}>{boardingPassData?.passenger_name || user?.user_metadata?.full_name || 'GDY·UP Traveler'}</p>
              </div>
              
              <div className={getThemeClasses({
                base: "h-px my-6",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })}></div>
              
              <div className="flex flex-col items-center">
                <div className={getThemeClasses({
                  base: "text-sm mb-1",
                  default: "text-gray-400",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Aircraft</div>
                <div className={getThemeClasses({
                  base: "text-base font-medium",
                  default: "text-white",
                  blue: "text-blue-100",
                  pink: "text-pink-100"
                })}>{offerData.aircraft_model || 'Private Jet'}</div>
              </div>
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