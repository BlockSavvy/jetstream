'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, Calendar, DollarSign, Loader2, CreditCard, Receipt, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SkeletonCard = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);

export default function JetShareBookings() {
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<JetShareOfferWithUser[]>([]);
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/jetshare/getBookings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load your flight share bookings');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch the bookings
    fetchBookings();
  }, []);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Accepted</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(2)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }
  
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6">
          <Plane className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold mb-3">No Bookings Yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't booked any flight shares yet. Browse available flight shares to find your next journey.
        </p>
        <Button asChild>
          <Link href="/jetshare/listings">Browse Flight Shares</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">Your Flight Share Bookings</h2>
        <Button asChild>
          <Link href="/jetshare/listings">Browse More Shares</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {booking.departure_location} to {booking.arrival_location}
                </CardTitle>
                {getStatusBadge(booking.status)}
              </div>
              <CardDescription>
                {format(new Date(booking.flight_date), 'EEE, MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(booking.flight_date), 'h:mm a')}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Flight by {booking.user.first_name} {booking.user.last_name?.[0]}.
                  </span>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    ${booking.requested_share_amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.round((booking.requested_share_amount / booking.total_flight_cost) * 100)}% share)
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View Details</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                      Review the details of your flight share booking.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Flight Route</h4>
                      <p className="text-lg font-semibold">{booking.departure_location} to {booking.arrival_location}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Date & Time</h4>
                      <p>{format(new Date(booking.flight_date), 'EEEE, MMMM d, yyyy')}</p>
                      <p>{format(new Date(booking.flight_date), 'h:mm a')}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Flight Owner</h4>
                      <p>{booking.user.first_name} {booking.user.last_name}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Cost Details</h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span>Share Amount:</span>
                          <span className="font-medium">${booking.requested_share_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                          <span>Original Flight Cost:</span>
                          <span>${booking.total_flight_cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                          <span>Your Portion:</span>
                          <span>{Math.round((booking.requested_share_amount / booking.total_flight_cost) * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>JetShare Fee (7.5%):</span>
                          <span>${(booking.requested_share_amount * 0.075).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                      <div className="flex items-center">
                        {getStatusBadge(booking.status)}
                        <span className="ml-2">
                          {booking.status === 'accepted' ? 'Payment confirmed, upcoming flight' : 
                           booking.status === 'completed' ? 'Flight completed' : booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    {booking.status === 'completed' ? (
                      <Button asChild>
                        <Link href={`/dashboard/jetshare/receipts/${booking.id}`}>
                          <Receipt className="mr-2 h-4 w-4" />
                          View Receipt
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="bg-amber-500 hover:bg-amber-600">
                        <Link href="/dashboard/jetshare">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Dashboard
                        </Link>
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {booking.status === 'accepted' ? (
                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600" asChild>
                  <Link href={`/dashboard/jetshare/boarding-pass/${booking.id}`}>
                    <Plane className="mr-2 h-4 w-4" />
                    Boarding Pass
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-600" asChild>
                  <Link href={`/dashboard/jetshare/receipts/${booking.id}`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Receipt
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 