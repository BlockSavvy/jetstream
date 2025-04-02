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
import JetSeatVisualizer, { SplitConfiguration } from './JetSeatVisualizer';

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
  
  // Format the date in a human-readable format
  const formattedDate = format(new Date(offer.flight_date), 'MMMM d, yyyy');

  // Extract split configuration if available
  const splitConfiguration: SplitConfiguration | null = offer.split_configuration ? {
    ...offer.split_configuration,
    // Add splitPercentage if it's missing - parse it from splitRatio or default to 50
    splitPercentage: offer.split_configuration.splitPercentage || 
      (offer.split_configuration.splitRatio ? 
        parseInt(offer.split_configuration.splitRatio.split('/')[0]) : 50)
  } : null;

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
      router.push('/jetshare/dashboard?tab=offers');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete offer');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Open</Badge>;
      case 'accepted':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Accepted</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Offer Details</h1>
        <div className="ml-4">{getStatusBadge(offer.status)}</div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plane className="h-5 w-5 mr-2" />
            Flight Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="text-sm text-muted-foreground">From</span>
              <p className="font-medium text-lg">{offer.departure_location}</p>
            </div>
            <Plane className="h-5 w-5 mx-4 transform rotate-90" />
            <div className="text-right">
              <span className="text-sm text-muted-foreground">To</span>
              <p className="font-medium text-lg">{offer.arrival_location}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Flight Date</span>
              </div>
              <p className="font-medium">{formattedDate}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Flight Cost</span>
              </div>
              <p className="font-medium">${offer.total_flight_cost.toLocaleString()}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Requested Share</span>
              </div>
              <p className="font-medium">${offer.requested_share_amount.toLocaleString()}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Share Percentage</span>
              </div>
              <p className="font-medium">
                {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}
              </p>
            </div>
          </div>
          
          {offer.matched_user && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Matched With</h3>
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  {offer.matched_user.first_name?.[0]}{offer.matched_user.last_name?.[0]}
                </div>
                <div>
                  <p className="font-medium">{offer.matched_user.first_name} {offer.matched_user.last_name}</p>
                  <p className="text-sm text-muted-foreground">{offer.matched_user.email}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isCreator && offer.status === 'open' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/jetshare/offer/edit/${offer.id}`)}
              >
                Edit Offer
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Offer'}
              </Button>
            </>
          )}
          
          {!isCreator && offer.status === 'open' && (
            <Button 
              className="w-full" 
              onClick={() => router.push(`/jetshare/payment/${offer.id}`)}
            >
              Accept & Pay Now
            </Button>
          )}
          
          {offer.status === 'accepted' && (
            <div className="w-full">
              <div className="bg-amber-50 p-4 rounded-md mb-4">
                <div className="flex items-center text-amber-800 mb-2">
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
                  className="w-full" 
                  onClick={() => router.push('/jetshare/dashboard?tab=transactions')}
                >
                  View Status
                </Button>
              ) : (
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700" 
                  onClick={() => router.push(`/jetshare/payment/${offer.id}`)}
                >
                  Complete Payment
                </Button>
              )}
            </div>
          )}
          
          {offer.status === 'completed' && (
            <div className="w-full">
              <div className="bg-green-50 p-4 rounded-md mb-4">
                <div className="flex items-center text-green-800 mb-2">
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
                className="w-full" 
                onClick={() => router.push(`/jetshare/transaction/${offer.id}`)}
              >
                View Flight & Transaction Details
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Seat Configuration Card */}
      {splitConfiguration && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Seat Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                <div className="mb-2 sm:mb-0">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Split Type:</span>
                  <span className="ml-2 font-medium">{splitConfiguration.splitOrientation === 'horizontal' ? 'Front/Back' : 'Left/Right'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ratio:</span>
                  <span className="ml-2 font-medium">{splitConfiguration.splitRatio}</span>
                </div>
              </div>
              
              <div className="py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <span className="text-sm text-gray-500 dark:text-gray-400">Seats Allocation:</span>
                {splitConfiguration.splitOrientation === 'horizontal' ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-sm">
                      <span className="font-semibold">Front: </span>
                      <span>{splitConfiguration.allocatedSeats.front?.length || 0} seats</span>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded-full text-sm">
                      <span className="font-semibold">Back: </span>
                      <span>{splitConfiguration.allocatedSeats.back?.length || 0} seats</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-sm">
                      <span className="font-semibold">Left: </span>
                      <span>{splitConfiguration.allocatedSeats.left?.length || 0} seats</span>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded-full text-sm">
                      <span className="font-semibold">Right: </span>
                      <span>{splitConfiguration.allocatedSeats.right?.length || 0} seats</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <JetSeatVisualizer 
                jetId={offer.aircraft_model?.toLowerCase().replace(/\s+/g, '-') || 'default-jet'}
                initialSplit={splitConfiguration}
                readOnly={true}
                showControls={false}
                totalSeats={offer.total_seats}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your flight share offer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOffer}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Offer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 