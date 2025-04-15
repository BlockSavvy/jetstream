import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { QrCode, Plane, ArrowRight, Download, Calendar, Clock, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
  // Use metadata from ticket if offer is not provided
  const departure = offer?.departure_location || ticket.metadata?.departure_location || 'Departure';
  const arrival = offer?.arrival_location || ticket.metadata?.arrival_location || 'Arrival';
  const aircraftModel = offer?.aircraft_model || ticket.metadata?.aircraft_model || 'Private Jet';
  const flightDate = offer?.flight_date || ticket.boarding_time;
  
  // Format date and time
  const formattedDate = format(new Date(flightDate), 'MMMM d, yyyy');
  const formattedTime = format(new Date(ticket.boarding_time), 'h:mm a');
  
  return (
    <Card className={`max-w-md mx-auto overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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
            <p className="text-gray-500 flex items-center mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              Date
            </p>
            <p className="font-medium">{formattedDate}</p>
          </div>
          <div>
            <p className="text-gray-500 flex items-center mb-1">
              <Clock className="h-3 w-3 mr-1" />
              Boarding Time
            </p>
            <p className="font-medium">{formattedTime}</p>
          </div>
          <div>
            <p className="text-gray-500 flex items-center mb-1">
              <MapPin className="h-3 w-3 mr-1" />
              Gate
            </p>
            <p className="font-medium">{ticket.gate}</p>
          </div>
          <div>
            <p className="text-gray-500 flex items-center mb-1">
              <Plane className="h-3 w-3 mr-1" />
              Seat
            </p>
            <p className="font-medium">{ticket.seat_number}</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="pt-2">
          <p className="text-gray-500 text-xs mb-1">Passenger</p>
          <p className="font-medium">{ticket.passenger_name}</p>
        </div>
        
        <div className="pt-2">
          <p className="text-gray-500 text-xs mb-1">Aircraft</p>
          <p className="font-medium">{aircraftModel}</p>
        </div>
        
        <div className="flex justify-center mt-4">
          <div className="bg-gray-50 p-4 rounded-md inline-block">
            <QrCode className="h-32 w-32 mx-auto text-gray-800" />
            <p className="text-center text-xs text-gray-500 mt-2">
              Scan at the gate
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gray-50 border-t">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
          View Details
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default JetShareTicket; 