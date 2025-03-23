import Image from 'next/image';
import { format } from 'date-fns';
import { Flight } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, Users, DollarSign, Plane, MapPin } from 'lucide-react';
import { getJetImage } from '@/lib/utils/jet-images';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/utils/format';

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
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-card border-2 border-muted', className)}>
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
          className="w-full" 
          size="lg"
          onClick={() => onBookNow(flight)}
        >
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
} 