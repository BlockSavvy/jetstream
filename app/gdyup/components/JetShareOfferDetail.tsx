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
  const { 
    isMobile, 
    getThemedTextClasses, 
    getThemedButtonClasses, 
    getThemedBackgroundClasses,
    getThemedBadgeClasses 
  } = useGdyupTheme();
  
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
          <Badge className={cn(
            "px-2 py-0.5 text-xs font-medium",
            "bg-blue-100 text-blue-800 hover:bg-blue-200"
          )}>
            Open
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className={cn(
            "px-2 py-0.5 text-xs font-medium",
            "bg-amber-100 text-amber-800 hover:bg-amber-200"
          )}>
            Accepted
          </Badge>
        );
      case 'completed':
        return (
          <Badge className={cn(
            "px-2 py-0.5 text-xs font-medium",
            "bg-green-100 text-green-800 hover:bg-green-200",
          )}>
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
          className={cn("mr-2", getThemedTextClasses())}
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className={cn("text-2xl font-bold", getThemedTextClasses())}>
          Offer Details
        </h1>
        <div className="ml-4">{getStatusBadge(offer.status)}</div>
      </div>
      
      <Card className={cn(
        "mb-6 border shadow-sm",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <CardHeader className={cn(
          "pb-3",
          getThemedBackgroundClasses('card'),
          "border-b border-gdyup-border"
        )}>
          <CardTitle className={cn("flex items-center", getThemedTextClasses())}>
            <Plane className={cn("h-5 w-5 mr-2", getThemedTextClasses('primary'))} />
            Flight Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className={cn(
            "flex justify-between items-center border-b pb-3",
            "border-gdyup-border"
          )}>
            <div>
              <span className={getThemedTextClasses('muted')}>From</span>
              <p className={cn("font-medium text-lg", getThemedTextClasses())}>
                {offer.departure_location}
              </p>
            </div>
            <Plane className={cn("h-5 w-5 mx-4 transform rotate-90", getThemedTextClasses('primary'))} />
            <div className="text-right">
              <span className={getThemedTextClasses('muted')}>To</span>
              <p className={cn("font-medium text-lg", getThemedTextClasses())}>
                {offer.arrival_location}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={getThemedTextClasses('muted')}>Date</span>
              <p className={cn("font-medium", getThemedTextClasses())}>
                {format(new Date(offer.flight_date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <span className={getThemedTextClasses('muted')}>Time</span>
              <p className={cn("font-medium", getThemedTextClasses())}>
                {offer.departure_time 
                  ? formatTime(offer.departure_time)
                  : formatTime(offer.flight_date)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <DollarSign className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                <span className={getThemedTextClasses('muted')}>Total Flight Cost</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>
                ${offer.total_flight_cost.toLocaleString()}
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <Users className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                <span className={getThemedTextClasses('muted')}>Requested Share</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>
                ${offer.requested_share_amount.toLocaleString()}
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <Info className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                <span className={getThemedTextClasses('muted')}>Share Percentage</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>
                {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          
          {offer.matched_user && (
            <div className={cn(
              "mt-6 pt-4 border-t",
              "border-gdyup-border"
            )}>
              <h3 className={cn("text-sm font-medium mb-2", getThemedTextClasses())}>
                Matched With
              </h3>
              <div className="flex items-center">
                <div className={cn(
                  "rounded-full w-10 h-10 flex items-center justify-center mr-3",
                  getThemedBackgroundClasses('card'),
                  getThemedTextClasses()
                )}>
                  {offer.matched_user.first_name?.[0]}{offer.matched_user.last_name?.[0]}
                </div>
                <div>
                  <p className={cn("font-medium", getThemedTextClasses())}>
                    {offer.matched_user.first_name} {offer.matched_user.last_name}
                  </p>
                  <p className={getThemedTextClasses('muted')}>
                    {offer.matched_user.email}
                  </p>
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
                  "bg-red-500 hover:bg-red-600 text-white",
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
              <div className={cn(
                "p-4 rounded-md mb-4",
                "bg-amber-50 text-amber-800 border border-amber-100"
              )}>
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <p className="font-medium">
                    {isCreator 
                      ? "Offer has been accepted" 
                      : "You've accepted this offer"}
                  </p>
                </div>
                <p className="text-sm text-amber-700">
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
                    "bg-amber-600 hover:bg-amber-700 text-white w-full"
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
              <div className={cn(
                "p-4 rounded-md mb-4",
                "bg-green-50 border border-green-100"
              )}>
                <div className={cn("flex items-center mb-2", "text-green-800")}>
                  <Info className="h-5 w-5 mr-2" />
                  <p className="font-medium">Flight share completed</p>
                </div>
                <p className="text-sm text-green-700">
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
        <AlertDialogContent className={cn(
          "border",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle className={getThemedTextClasses()}>
              Delete Offer
            </AlertDialogTitle>
            <AlertDialogDescription className={getThemedTextClasses('muted')}>
              Are you sure you want to delete this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              getThemedButtonClasses("outline")
            )}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOffer}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
} 