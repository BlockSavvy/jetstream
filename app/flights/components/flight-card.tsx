import Image from 'next/image';
import { format } from 'date-fns';
import { Flight } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Users, DollarSign, Plane, MapPin, Sparkles, Star } from 'lucide-react';
import { getJetImage } from '@/lib/utils/jet-images';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FlightCardProps {
  flight: Flight;
  onBookNow: (flight: Flight) => void;
  className?: string;
}

export function FlightCard({ flight, onBookNow, className }: FlightCardProps) {
  // Add logging to debug the flight object structure
  console.log('Flight data in card:', {
    flight_id: flight.id,
    origin: flight.origin,
    destination: flight.destination,
    jet: flight.jets
  });
  
  // Use origin and destination from the API response
  const originAirport = flight.origin || { city: 'Unknown', code: 'N/A', name: 'Unknown', country: 'Unknown' };
  const destinationAirport = flight.destination || { city: 'Unknown', code: 'N/A', name: 'Unknown', country: 'Unknown' };
  const jet = flight.jets;
  
  // Check if this is a specialized event
  const isSpecializedEvent = flight.specialized_event;
  const hasCrew = !!flight.crew;
  
  // Format dates
  const departureDate = new Date(flight.departure_time);
  const arrivalDate = new Date(flight.arrival_time);
  
  // Calculate flight duration in hours and minutes
  const durationMs = arrivalDate.getTime() - departureDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(flight.base_price);

  // Get jet image or placeholder
  const jetImage = getJetImage(jet, 0, 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');

  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-card border-2 border-muted', 
      isSpecializedEvent ? 'border-amber-200' : '', 
      className
    )}>
      <div className="relative h-48">
        <Image 
          src={jetImage} 
          alt={`${jet.manufacturer} ${jet.model}`} 
          fill 
          style={{ objectFit: 'cover' }} 
          className="transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="font-semibold bg-primary text-primary-foreground">
            {formattedPrice}
          </Badge>
        </div>
        
        {isSpecializedEvent && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="outline" className="bg-amber-500/80 backdrop-blur-sm text-white border-amber-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Special Event</span>
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">{jet.manufacturer} {jet.model}</h3>
            <p className="text-muted-foreground text-sm">{jet.tail_number}</p>
          </div>
          <Badge variant={flight.available_seats > 5 ? "outline" : flight.available_seats > 2 ? "secondary" : "destructive"}>
            {flight.available_seats} {flight.available_seats === 1 ? 'seat' : 'seats'} left
          </Badge>
        </div>
        
        {isSpecializedEvent && flight.specialized_details && (
          <div className="mb-4 p-3 bg-amber-50 rounded-md border border-amber-100">
            <h4 className="font-medium text-amber-800">{flight.specialized_details.title}</h4>
            <p className="text-xs text-amber-700 mt-1">{flight.specialized_details.theme}</p>
            {flight.specialized_details.description && (
              <p className="text-xs text-amber-600 mt-2 line-clamp-2">{flight.specialized_details.description}</p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 my-4">
          <div className="text-left">
            <p className="font-bold text-lg">{originAirport.city}</p>
            <p className="text-muted-foreground text-xs">{originAirport.code}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <Plane className="h-4 w-4 rotate-90 mb-1" />
            <div className="text-xs text-muted-foreground">{durationHours}h {durationMinutes}m</div>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-lg">{destinationAirport.city}</p>
            <p className="text-muted-foreground text-xs">{destinationAirport.code}</p>
          </div>
        </div>
        
        {hasCrew && flight.crew && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8 border border-amber-200">
                <AvatarImage 
                  src={flight.crew.profileImageUrl || undefined} 
                  alt={flight.crew.name} 
                />
                <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                  {flight.crew.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center">
                  <p className="text-sm font-medium">{flight.crew.name}</p>
                  {flight.crew.ratingsAvg > 0 && (
                    <div className="flex items-center ml-2">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs ml-0.5">{flight.crew.ratingsAvg.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {flight.crew.specializations && flight.crew.specializations.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {flight.crew.specializations.slice(0, 1).join(', ')}
                    {flight.crew.specializations.length > 1 && ` +${flight.crew.specializations.length - 1} more`}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(departureDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(departureDate, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{originAirport.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Capacity: {jet.capacity}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-6 px-6">
        <Button 
          className={cn("w-full", isSpecializedEvent ? "bg-amber-500 hover:bg-amber-600 text-white" : "")}
          size="lg"
          onClick={() => onBookNow(flight)}
        >
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
} 