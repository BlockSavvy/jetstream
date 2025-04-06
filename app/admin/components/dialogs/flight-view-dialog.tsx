'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users
} from 'lucide-react';
import { useUi } from '../ui-context';

export function FlightViewDialog() {
  const { flightViewOpen, selectedFlight, closeFlightDialogs } = useUi();

  if (!selectedFlight) return null;

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time helper
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency helper
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status badge color mapping
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    boarding: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    in_air: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <Dialog open={flightViewOpen} onOpenChange={closeFlightDialogs}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Flight Details</DialogTitle>
          <DialogDescription>
            Complete information about this flight.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">
                {selectedFlight.origin?.code || selectedFlight.origin_airport} → {selectedFlight.destination?.code || selectedFlight.destination_airport}
              </h3>
            </div>
            <Badge className={
              statusColors[selectedFlight.status as keyof typeof statusColors] || 
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }>
              {selectedFlight.status.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Badge>
          </div>

          {selectedFlight.origin?.city && selectedFlight.destination?.city && (
            <p className="text-sm text-gray-500 mb-4">
              {selectedFlight.origin.city} to {selectedFlight.destination.city}
            </p>
          )}

          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Departure Date</div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatDate(selectedFlight.departure_time)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Departure Time</div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatTime(selectedFlight.departure_time)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Arrival Date</div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatDate(selectedFlight.arrival_time)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Arrival Time</div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatTime(selectedFlight.arrival_time)}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Aircraft</div>
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {selectedFlight.jet ? 
                    `${selectedFlight.jet.manufacturer || ''} ${selectedFlight.jet.model || ''}`.trim() || 
                    selectedFlight.jet.tail_number : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Available Seats</div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{selectedFlight.available_seats}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Base Price</div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-bold">{formatCurrency(selectedFlight.base_price)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium">Timestamps</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">Created: {formatDate(selectedFlight.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">Updated: {formatDate(selectedFlight.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={closeFlightDialogs}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 