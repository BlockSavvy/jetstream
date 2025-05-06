'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Plane, Calendar, DollarSign, Users, Info, AlertTriangle, ArrowLeft } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { formatTime } from '@/lib/utils';
import VisualizerWrapper from './VisualizerWrapper';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface JetShareOfferDetailProps {
  offer: JetShareOfferWithUser;
  user: User;
  isCreator?: boolean;
  isMatchedUser?: boolean;
}

export default function JetShareOfferDetail({ offer, user, isCreator = false, isMatchedUser = false }: JetShareOfferDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { getThemeClasses, getThemedButtonClasses, isMobile } = useGdyupTheme();
  
  // Format the date in a human-readable format
  const formattedDate = format(new Date(offer.flight_date), 'MMMM d, yyyy');

  const handleDeleteOffer = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jetshare/deleteOffer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offer_id: offer.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete offer');
      }
      
      toast.success('Offer deleted successfully');
      router.push('/gdyup/dashboard?tab=offers');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete offer');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge className={getThemeClasses({
            base: "px-2 py-0.5 text-xs font-medium",
            default: "bg-blue-100 text-blue-800 hover:bg-blue-200",
            blue: "bg-blue-900 text-blue-100 hover:bg-blue-800",
            pink: "bg-pink-900 text-pink-100 hover:bg-pink-800"
          })}>
            Open
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className={getThemeClasses({
            base: "px-2 py-0.5 text-xs font-medium",
            default: "bg-amber-100 text-amber-800 hover:bg-amber-200",
            blue: "bg-amber-900 text-amber-100 hover:bg-amber-800",
            pink: "bg-amber-900 text-amber-100 hover:bg-amber-800"
          })}>
            Accepted
          </Badge>
        );
      case 'completed':
        return (
          <Badge className={getThemeClasses({
            base: "px-2 py-0.5 text-xs font-medium",
            default: "bg-green-100 text-green-800 hover:bg-green-200",
            blue: "bg-green-900 text-green-100 hover:bg-green-800",
            pink: "bg-green-900 text-green-100 hover:bg-green-800"
          })}>
            Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className={getThemeClasses({
            base: "mr-2",
            default: "text-gray-800 hover:text-black hover:bg-gray-100",
            blue: "text-blue-100 hover:text-white hover:bg-blue-800",
            pink: "text-pink-100 hover:text-white hover:bg-pink-800"
          })}
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className={getThemeClasses({
          base: "text-2xl font-bold", 
          default: "text-gray-900",
          blue: "text-blue-50",
          pink: "text-pink-50"
        })}>
          Offer Details
        </h1>
        <div className="ml-4">{getStatusBadge(offer.status)}</div>
      </div>
      
      <Card className={getThemeClasses({
        base: "mb-6 border shadow-sm",
        default: "bg-white border-gray-200",
        blue: "bg-blue-950/40 border-blue-900/60",
        pink: "bg-pink-950/40 border-pink-900/60"
      })}>
        <CardHeader className={getThemeClasses({
          base: "pb-3",
          default: "bg-gray-50 border-b border-gray-100",
          blue: "bg-blue-950/60 border-b border-blue-900/60",
          pink: "bg-pink-950/60 border-b border-pink-900/60"
        })}>
          <CardTitle className={cn("flex items-center", getThemeClasses({
            base: "",
            default: "text-gray-900",
            blue: "text-blue-50",
            pink: "text-pink-50"
          }))}>
            <Plane className={cn("h-5 w-5 mr-2", getThemeClasses({
              base: "",
              default: "text-amber-500",
              blue: "text-amber-400",
              pink: "text-amber-400"
            }))} />
            Flight Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className={cn("flex justify-between items-center border-b pb-3", getThemeClasses({
            base: "",
            default: "border-gray-200",
            blue: "border-blue-900/30",
            pink: "border-pink-900/30"
          }))}>
            <div>
              <span className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-500",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>From</span>
              <p className={getThemeClasses({
                base: "font-medium text-lg",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>{offer.departure_location}</p>
            </div>
            <Plane className={cn("h-5 w-5 mx-4 transform rotate-90", getThemeClasses({
              base: "",
              default: "text-amber-500",
              blue: "text-amber-400",
              pink: "text-amber-400"
            }))} />
            <div className="text-right">
              <span className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-500",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>To</span>
              <p className={getThemeClasses({
                base: "font-medium text-lg",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>{offer.arrival_location}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-500",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Date</span>
              <p className={getThemeClasses({
                base: "font-medium",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>{format(new Date(offer.flight_date), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="text-right">
              <span className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-500",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>Time</span>
              <p className={getThemeClasses({
                base: "font-medium",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>
                {offer.departure_time 
                  ? formatTime(offer.departure_time)
                  : formatTime(offer.flight_date)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <DollarSign className={cn("h-4 w-4 mr-2", getThemeClasses({
                  base: "",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                }))} />
                <span className={getThemeClasses({
                  base: "text-sm",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Total Flight Cost</span>
              </div>
              <p className={getThemeClasses({
                base: "font-medium",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>${offer.total_flight_cost.toLocaleString()}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <Users className={cn("h-4 w-4 mr-2", getThemeClasses({
                  base: "",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                }))} />
                <span className={getThemeClasses({
                  base: "text-sm",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Requested Share</span>
              </div>
              <p className={getThemeClasses({
                base: "font-medium",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>${offer.requested_share_amount.toLocaleString()}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <Info className={cn("h-4 w-4 mr-2", getThemeClasses({
                  base: "",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                }))} />
                <span className={getThemeClasses({
                  base: "text-sm",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Share Percentage</span>
              </div>
              <p className={getThemeClasses({
                base: "font-medium",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>
                {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          
          {offer.matched_user && (
            <div className={cn("mt-6 pt-4 border-t", getThemeClasses({
              base: "",
              default: "border-gray-200",
              blue: "border-blue-900/30",
              pink: "border-pink-900/30"
            }))}>
              <h3 className={getThemeClasses({
                base: "text-sm font-medium mb-2",
                default: "text-gray-900",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>Matched With</h3>
              <div className="flex items-center">
                <div className={getThemeClasses({
                  base: "bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mr-3",
                  default: "bg-gray-100 text-gray-800",
                  blue: "bg-blue-900/60 text-blue-100",
                  pink: "bg-pink-900/60 text-pink-100"
                })}>
                  {offer.matched_user.first_name?.[0]}{offer.matched_user.last_name?.[0]}
                </div>
                <div>
                  <p className={getThemeClasses({
                    base: "font-medium",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>{offer.matched_user.first_name} {offer.matched_user.last_name}</p>
                  <p className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>{offer.matched_user.email}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className={cn(
          "flex justify-between gap-2 p-4 sticky bottom-0",
          isMobile ? "flex-col mt-auto" : ""
        )}>
          {isCreator && offer.status === 'open' && (
            <>
              <Button 
                variant="outline" 
                className={getThemedButtonClasses("outline")}
                onClick={() => router.push(`/gdyup/offer/edit/${offer.id}`)}
              >
                Edit Offer
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className={cn(
                  getThemeClasses({
                    base: "",
                    default: "bg-red-500 hover:bg-red-600 text-white",
                    blue: "bg-red-600 hover:bg-red-700 text-white",
                    pink: "bg-red-600 hover:bg-red-700 text-white"
                  }),
                  isMobile ? "w-full" : ""
                )}
              >
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </Button>
            </>
          )}
          
          {!isCreator && offer.status === 'open' && (
            <Button 
              className={cn(
                getThemedButtonClasses("primary"),
                "w-full"
              )}
              onClick={(e) => {
                e.preventDefault();
                // Ensure offer ID is properly formatted and add query params for tracking
                const formattedOfferId = offer.id.replace(/-/g, '');
                // Use direct link for more reliability
                window.location.href = `/gdyup/payment/${offer.id}?t=${Date.now()}&from=offer_detail`;
              }}
            >
              Accept & Pay Now
            </Button>
          )}
          
          {offer.status === 'accepted' && (
            <div className="w-full">
              <div className={getThemeClasses({
                base: "p-4 rounded-md mb-4",
                default: "bg-amber-50 text-amber-800 border border-amber-100",
                blue: "bg-amber-900/30 text-amber-100 border border-amber-800/50",
                pink: "bg-amber-900/30 text-amber-100 border border-amber-800/50"
              })}>
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <p className="font-medium">
                    {isCreator 
                      ? "Offer has been accepted" 
                      : "You've accepted this offer"}
                  </p>
                </div>
                <p className={getThemeClasses({
                  base: "text-sm",
                  default: "text-amber-700",
                  blue: "text-amber-200",
                  pink: "text-amber-200"
                })}>
                  {isCreator 
                    ? `This offer has been accepted by ${offer.matched_user?.first_name} ${offer.matched_user?.last_name}. Awaiting payment.` 
                    : `You've accepted this flight share. Please complete payment to confirm your booking.`}
                </p>
              </div>
              
              {isCreator ? (
                <Button 
                  className={cn(
                    getThemedButtonClasses("primary"),
                    "w-full"
                  )}
                  onClick={() => router.push('/gdyup/dashboard?tab=transactions')}
                >
                  View Status
                </Button>
              ) : (
                <Button 
                  className={cn(
                    getThemeClasses({
                      base: "w-full",
                      default: "bg-amber-600 hover:bg-amber-700 text-white",
                      blue: "bg-amber-600 hover:bg-amber-700 text-white",
                      pink: "bg-amber-600 hover:bg-amber-700 text-white"
                    })
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    // Use direct navigation for more reliability
                    window.location.href = `/gdyup/payment/${offer.id}?t=${Date.now()}&from=offer_detail`;
                  }}
                >
                  Complete Payment
                </Button>
              )}
            </div>
          )}
          
          {offer.status === 'completed' && (
            <div className="w-full">
              <div className={getThemeClasses({
                base: "p-4 rounded-md mb-4",
                default: "bg-green-50 border border-green-100",
                blue: "bg-green-900/30 border border-green-800/50",
                pink: "bg-green-900/30 border border-green-800/50"
              })}>
                <div className={cn("flex items-center mb-2", getThemeClasses({
                  base: "",
                  default: "text-green-800",
                  blue: "text-green-100",
                  pink: "text-green-100"
                }))}>
                  <Info className="h-5 w-5 mr-2" />
                  <p className="font-medium">Flight share completed</p>
                </div>
                <p className={getThemeClasses({
                  base: "text-sm",
                  default: "text-green-700",
                  blue: "text-green-200",
                  pink: "text-green-200"
                })}>
                  {isCreator 
                    ? `This flight share has been completed successfully. Payment has been received.` 
                    : `This flight share has been completed successfully. Your payment has been processed.`}
                </p>
              </div>
              <Button 
                className={cn(
                  getThemedButtonClasses("primary"),
                  "w-full"
                )}
                onClick={() => router.push(`/gdyup/boardingpass/${offer.id}`)}
              >
                View Boarding Pass
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className={getThemeClasses({
          base: "border",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950 border-blue-900 text-blue-50",
          pink: "bg-pink-950 border-pink-900 text-pink-50"
        })}>
          <AlertDialogHeader>
            <AlertDialogTitle className={getThemeClasses({
              base: "",
              default: "text-gray-900",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription className={getThemeClasses({
              base: "",
              default: "text-gray-500",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              Are you sure you want to delete this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={getThemeClasses({
              base: "",
              default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
              blue: "bg-blue-900 text-blue-50 hover:bg-blue-800 border-blue-800",
              pink: "bg-pink-900 text-pink-50 hover:bg-pink-800 border-pink-800"
            })}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOffer} 
              disabled={isDeleting}
              className={getThemeClasses({
                base: "",
                default: "bg-red-500 hover:bg-red-600 text-white",
                blue: "bg-red-600 hover:bg-red-700 text-white",
                pink: "bg-red-600 hover:bg-red-700 text-white"
              })}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
} 