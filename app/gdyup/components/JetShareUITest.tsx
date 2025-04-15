'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { format, addDays } from 'date-fns';
import { CheckCircle, AlertTriangle, Plane, ArrowRight, Calendar, DollarSign } from 'lucide-react';

// Example offer data
const mockOffers = [
  {
    id: '1',
    user_id: 'user1',
    flight_date: addDays(new Date(), 5).toISOString(),
    departure_location: 'New York, NY',
    arrival_location: 'Miami, FL',
    total_flight_cost: 35000,
    requested_share_amount: 17500,
    status: 'open',
    created_at: new Date().toISOString(),
    isOwnOffer: true,
    user: {
      id: 'user1',
      first_name: 'John',
      last_name: 'Doe',
      avatar_url: null,
      verification_status: 'verified'
    }
  },
  {
    id: '2',
    user_id: 'user2',
    flight_date: addDays(new Date(), 7).toISOString(),
    departure_location: 'Los Angeles, CA',
    arrival_location: 'Las Vegas, NV',
    total_flight_cost: 22000,
    requested_share_amount: 11000,
    status: 'open',
    created_at: new Date().toISOString(),
    user: {
      id: 'user2',
      first_name: 'Jane',
      last_name: 'Smith',
      avatar_url: null,
      verification_status: 'verified'
    }
  },
  {
    id: '3',
    user_id: 'user3',
    flight_date: addDays(new Date(), 10).toISOString(),
    departure_location: 'Chicago, IL',
    arrival_location: 'Dallas, TX',
    total_flight_cost: 28000,
    requested_share_amount: 14000,
    status: 'open',
    created_at: new Date().toISOString(),
    user: {
      id: 'user3',
      first_name: 'Robert',
      last_name: 'Johnson',
      avatar_url: null,
      verification_status: 'pending'
    }
  }
];

/**
 * A component for testing and visualizing JetShare UI components
 */
export function JetShareUITest() {
  const [selectedTab, setSelectedTab] = useState('card');
  
  // Offer Card component
  const OfferCard = ({ offer, isOwn = false }: { offer: any, isOwn?: boolean }) => (
    <Card className="overflow-hidden">
      <div className="relative">
        {isOwn && (
          <div className="absolute top-0 right-0 m-2 z-10">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              Your Offer
            </Badge>
          </div>
        )}
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{offer.departure_location} to {offer.arrival_location}</CardTitle>
              <CardDescription>
                <div className="flex items-center mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                  <span>{format(new Date(offer.flight_date), 'MMM d, yyyy')}</span>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">${offer.requested_share_amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}% of ${offer.total_flight_cost.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {offer.user?.first_name?.[0] || 'U'}
                {offer.user?.last_name?.[0] || 'U'}
              </AvatarFallback>
              {offer.user?.avatar_url && (
                <AvatarImage src={offer.user.avatar_url} alt={`${offer.user.first_name} ${offer.user.last_name}`} />
              )}
            </Avatar>
            <span className="text-sm">
              {offer.user?.first_name} {offer.user?.last_name?.[0] || ''}
              {offer.user?.verification_status === 'verified' && (
                <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
              )}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            variant={isOwn ? "outline" : "default"}
            disabled={isOwn}
          >
            {isOwn ? "Your Own Offer" : "View Details"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
  
  // Offer Details component
  const OfferDetails = ({ offer }: { offer: any }) => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{offer.departure_location}</span>
        </div>
        <ArrowRight className="h-4 w-4 mx-2" />
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-muted-foreground rotate-90" />
          <span className="font-medium">{offer.arrival_location}</span>
        </div>
      </div>
      
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="font-medium">{format(new Date(offer.flight_date), 'MMMM d, yyyy')}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Requested Share</p>
          <p className="font-medium">${offer.requested_share_amount.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Flight Cost</p>
          <p className="font-medium">${offer.total_flight_cost.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Share Percentage</p>
          <p className="font-medium">
            {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}
          </p>
        </div>
      </div>
      
      <div className="pt-3 border-t">
        <p className="text-sm text-muted-foreground">Offered by</p>
        <div className="flex items-center gap-2 mt-1">
          <Avatar>
            <AvatarFallback>
              {offer.user?.first_name?.[0] || 'U'}
              {offer.user?.last_name?.[0] || 'U'}
            </AvatarFallback>
            {offer.user?.avatar_url && (
              <AvatarImage 
                src={offer.user.avatar_url} 
                alt={`${offer.user.first_name} ${offer.user.last_name}`} 
              />
            )}
          </Avatar>
          <div>
            <p className="font-medium">
              {offer.user?.first_name} {offer.user?.last_name}
              {offer.user?.verification_status === 'verified' && (
                <CheckCircle className="h-3.5 w-3.5 text-green-500 inline ml-1" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              This flight share is offered by a {offer.user?.verification_status === 'verified' ? 'verified' : 'pending'} JetShare user. The requested share amount is
              {' '}{((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}
              {' '}of the total flight cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Empty State component
  const EmptyState = () => (
    <div className="text-center p-8 border rounded-lg">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Plane className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Flight Shares Available</h3>
      <p className="text-muted-foreground mb-4">
        There are currently no flight shares matching your criteria.
      </p>
      <Button>Create Your Own</Button>
    </div>
  );
  
  // Error State component
  const ErrorState = () => (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Flight Shares</AlertTitle>
      <AlertDescription>
        We encountered an error while trying to load flight shares. Please try again later.
      </AlertDescription>
    </Alert>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>JetShare UI Components</CardTitle>
        <CardDescription>
          Preview and test JetShare UI components with mock data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="card">Offer Cards</TabsTrigger>
            <TabsTrigger value="details">Offer Details</TabsTrigger>
            <TabsTrigger value="empty">Empty State</TabsTrigger>
            <TabsTrigger value="error">Error State</TabsTrigger>
          </TabsList>
          
          <TabsContent value="card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <OfferCard offer={mockOffers[0]} isOwn={true} />
              <OfferCard offer={mockOffers[1]} />
              <OfferCard offer={mockOffers[2]} />
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <OfferDetails offer={mockOffers[0]} />
          </TabsContent>
          
          <TabsContent value="empty">
            <EmptyState />
          </TabsContent>
          
          <TabsContent value="error">
            <ErrorState />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        These UI components are used throughout the JetShare module
      </CardFooter>
    </Card>
  );
} 