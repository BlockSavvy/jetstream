import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { QrCode, Plane, ArrowRight, Download, Calendar, Clock, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

interface JetShareTicketProps {
  ticket: {
    id: string;
    ticket_code: string;
    passenger_name: string;
    seat_number: string;
    boarding_time: string;
    gate: string;
    status: string;
    offer_id: string;
    metadata?: {
      departure_location?: string;
      arrival_location?: string;
      aircraft_model?: string;
    };
  };
  offer?: {
    departure_location: string;
    arrival_location: string;
    flight_date: string;
    aircraft_model?: string;
  };
  className?: string;
}

export function JetShareTicket({ ticket, offer, className }: JetShareTicketProps) {
  // Initialize theming helpers
  const { 
    getThemedTextClasses, 
    getThemedButtonClasses, 
    getThemedBackgroundClasses 
  } = useGdyupTheme();

  // Use metadata from ticket if offer is not provided
  const departure = offer?.departure_location || ticket.metadata?.departure_location || 'Departure';
  const arrival = offer?.arrival_location || ticket.metadata?.arrival_location || 'Arrival';
  const aircraftModel = offer?.aircraft_model || ticket.metadata?.aircraft_model || 'Private Jet';
  const flightDate = offer?.flight_date || ticket.boarding_time;
  
  // Format date and time
  const formattedDate = format(new Date(flightDate), 'MMMM d, yyyy');
  const formattedTime = format(new Date(ticket.boarding_time), 'h:mm a');
  
  return (
    <Card className={cn(
      "max-w-md mx-auto overflow-hidden",
      getThemedBackgroundClasses('card'),
      "border-gdyup-border",
      className
    )}>
      <CardHeader className={cn(
        "pb-0",
        getThemedBackgroundClasses('primary'),
        getThemedTextClasses('inverse')
      )}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Boarding Pass</CardTitle>
          <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">
            {ticket.ticket_code}
          </span>
        </div>
        <div className="flex justify-between items-center mt-4 pb-4">
          <div>
            <p className="text-2xl font-bold">{departure}</p>
            <p className="text-xs opacity-80">Departure</p>
          </div>
          <Plane className="h-6 w-6 mx-2 text-white/70" />
          <div className="text-right">
            <p className="text-2xl font-bold">{arrival}</p>
            <p className="text-xs opacity-80">Arrival</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className={cn("flex items-center mb-1", getThemedTextClasses('muted'))}>
              <Calendar className="h-3 w-3 mr-1" />
              Date
            </p>
            <p className={cn("font-medium", getThemedTextClasses())}>
              {formattedDate}
            </p>
          </div>
          <div>
            <p className={cn("flex items-center mb-1", getThemedTextClasses('muted'))}>
              <Clock className="h-3 w-3 mr-1" />
              Boarding Time
            </p>
            <p className={cn("font-medium", getThemedTextClasses())}>
              {formattedTime}
            </p>
          </div>
          <div>
            <p className={cn("flex items-center mb-1", getThemedTextClasses('muted'))}>
              <MapPin className="h-3 w-3 mr-1" />
              Gate
            </p>
            <p className={cn("font-medium", getThemedTextClasses())}>
              {ticket.gate}
            </p>
          </div>
          <div>
            <p className={cn("flex items-center mb-1", getThemedTextClasses('muted'))}>
              <Plane className="h-3 w-3 mr-1" />
              Seat
            </p>
            <p className={cn("font-medium", getThemedTextClasses())}>
              {ticket.seat_number}
            </p>
          </div>
        </div>
        
        <Separator className={cn("my-4", "bg-gdyup-border")} />
        
        <div className="pt-2">
          <p className={cn("text-xs mb-1", getThemedTextClasses('muted'))}>
            Passenger
          </p>
          <p className={cn("font-medium", getThemedTextClasses())}>
            {ticket.passenger_name}
          </p>
        </div>
        
        <div className="pt-2">
          <p className={cn("text-xs mb-1", getThemedTextClasses('muted'))}>
            Aircraft
          </p>
          <p className={cn("font-medium", getThemedTextClasses())}>
            {aircraftModel}
          </p>
        </div>
        
        <div className="flex justify-center mt-4">
          <div className={cn(
            "p-4 rounded-md inline-block",
            getThemedBackgroundClasses('card'),
            "border border-gdyup-border"
          )}>
            <QrCode className={cn("h-32 w-32 mx-auto", getThemedTextClasses())} />
            <p className={cn("text-center text-xs mt-2", getThemedTextClasses('muted'))}>
              Scan at the gate
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={cn(
        "flex justify-between border-t",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <Button 
          variant="outline" 
          size="sm"
          className={getThemedButtonClasses('outline')}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className={getThemedButtonClasses()}
        >
          View Details
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default JetShareTicket; 