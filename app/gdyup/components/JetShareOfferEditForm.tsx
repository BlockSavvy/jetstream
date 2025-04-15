'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import JetSelector from './JetSelector';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface JetShareOfferEditFormProps {
  offer: JetShareOfferWithUser;
  userId: string;
}

const formSchema = z.object({
  departure_location: z.string().min(1, {
    message: "Departure location is required",
  }),
  arrival_location: z.string().min(1, {
    message: "Arrival location is required",
  }),
  flight_date: z.date().min(new Date(), {
    message: "Flight date must be in the future",
  }),
  departure_time: z.date().optional(),
  total_flight_cost: z.number().min(0, {
    message: "Total flight cost must be greater than 0",
  }),
  requested_share_amount: z.number().min(0, {
    message: "Requested share amount must be greater than 0",
  }),
  aircraft_model: z.string().min(2, {
    message: "Aircraft model is required",
  }),
  jet_id: z.string().optional(),
  total_seats: z.number().min(0, {
    message: "Total seats must be greater than 0",
  }),
  available_seats: z.number().min(0, {
    message: "Available seats must be greater than 0",
  }),
  seat_split_configuration: z.any().optional(),
});

export default function JetShareOfferEditForm({ offer, userId }: JetShareOfferEditFormProps) {
  const router = useRouter();
  
  const [selectedJetId, setSelectedJetId] = useState<string>(
    offer.jet_id || 'default'
  );
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flight_date: new Date(offer.flight_date || offer.departure_time),
      departure_time: new Date(offer.departure_time || offer.flight_date),
      departure_location: offer.departure_location || "",
      arrival_location: offer.arrival_location || "",
      aircraft_model: offer.aircraft_model || "",
      jet_id: offer.jet_id || "",
      total_seats: offer.total_seats || 8,
      available_seats: offer.available_seats || 4,
      total_flight_cost: offer.total_flight_cost || 25000,
      requested_share_amount: offer.requested_share_amount || 12500,
      seat_split_configuration: offer.split_configuration || null
    },
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.getValues('departure_location')) {
      newErrors.departure_location = 'Departure location is required';
    }
    
    if (!form.getValues('arrival_location')) {
      newErrors.arrival_location = 'Arrival location is required';
    }
    
    if (!form.getValues('flight_date')) {
      newErrors.flight_date = 'Flight date is required';
    } else if (form.getValues('flight_date') < new Date()) {
      newErrors.flight_date = 'Flight date must be in the future';
    }
    
    if (!form.getValues('total_flight_cost') || form.getValues('total_flight_cost') <= 0) {
      newErrors.total_flight_cost = 'Total flight cost must be greater than 0';
    }
    
    if (!form.getValues('requested_share_amount') || form.getValues('requested_share_amount') <= 0) {
      newErrors.requested_share_amount = 'Requested share amount must be greater than 0';
    } else if (form.getValues('requested_share_amount') >= form.getValues('total_flight_cost')) {
      newErrors.requested_share_amount = 'Share amount must be less than total cost';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/jetshare/updateOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offer.id,
          ...form.getValues(),
          // Convert date to ISO string
          flight_date: format(form.getValues('flight_date'), 'yyyy-MM-dd'),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update the offer');
      }
      
      toast.success('Offer updated successfully');
      router.push(`/jetshare/offer/${offer.id}`);
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update the offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateTotalFlightCost = (value: string) => {
    const numValue = parseFloat(value);
    form.setValue('total_flight_cost', isNaN(numValue) ? 0 : numValue);
  };

  const updateRequestedShareAmount = (value: string) => {
    const numValue = parseFloat(value);
    form.setValue('requested_share_amount', isNaN(numValue) ? 0 : numValue);
  };

  const updateDepartureLocation = (value: string) => {
    form.setValue('departure_location', value);
  };

  const updateArrivalLocation = (value: string) => {
    form.setValue('arrival_location', value);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue('flight_date', date);
    }
  };
  
  useEffect(() => {
    const handleJetChange = (event: any) => {
      const { value, seatCapacity, jetId } = event.detail;
      console.log('JetSelector change event received:', { value, seatCapacity, jetId });
      
      // Update form with selected aircraft model
      form.setValue('aircraft_model', value);
      
      // Update jet_id if provided
      if (jetId) {
        form.setValue('jet_id', jetId);
        setSelectedJetId(jetId);
      }
      
      // If seat capacity is provided, update related fields
      if (seatCapacity && seatCapacity > 0) {
        form.setValue('total_seats', seatCapacity);
        // Only update available seats if they exceed the new total
        const currentAvailable = form.getValues('available_seats');
        if (currentAvailable > seatCapacity) {
          form.setValue('available_seats', Math.floor(seatCapacity / 2));
        }
      }
    };
    
    // Add and remove event listeners
    window.addEventListener('jetchange', handleJetChange);
    return () => window.removeEventListener('jetchange', handleJetChange);
  }, [form]);
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="departure_location">Departure Location</Label>
            <Input
              id="departure_location"
              name="departure_location"
              value={form.getValues('departure_location')}
              onChange={(e) => updateDepartureLocation(e.target.value)}
              placeholder="e.g., New York (JFK)"
              className={errors.departure_location ? 'border-red-500' : ''}
            />
            {errors.departure_location && (
              <p className="text-red-500 text-sm">{errors.departure_location}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="arrival_location">Arrival Location</Label>
            <Input
              id="arrival_location"
              name="arrival_location"
              value={form.getValues('arrival_location')}
              onChange={(e) => updateArrivalLocation(e.target.value)}
              placeholder="e.g., Los Angeles (LAX)"
              className={errors.arrival_location ? 'border-red-500' : ''}
            />
            {errors.arrival_location && (
              <p className="text-red-500 text-sm">{errors.arrival_location}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="flight_date">Flight Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="flight_date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.getValues('flight_date') && "text-muted-foreground",
                    errors.flight_date ? 'border-red-500' : ''
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.getValues('flight_date') ? format(form.getValues('flight_date'), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.getValues('flight_date')}
                  onSelect={handleDateChange}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {errors.flight_date && (
              <p className="text-red-500 text-sm">{errors.flight_date}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aircraft_model">Aircraft Model</Label>
            <FormField
              control={form.control}
              name="aircraft_model"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <JetSelector
                      value={field.value}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total_flight_cost">Total Flight Cost ($)</Label>
            <Input
              id="total_flight_cost"
              name="total_flight_cost"
              type="number"
              value={form.getValues('total_flight_cost')}
              onChange={(e) => updateTotalFlightCost(e.target.value)}
              placeholder="e.g., 25000"
              className={errors.total_flight_cost ? 'border-red-500' : ''}
            />
            {errors.total_flight_cost && (
              <p className="text-red-500 text-sm">{errors.total_flight_cost}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requested_share_amount">Requested Share Amount ($)</Label>
            <Input
              id="requested_share_amount"
              name="requested_share_amount"
              type="number"
              value={form.getValues('requested_share_amount')}
              onChange={(e) => updateRequestedShareAmount(e.target.value)}
              placeholder="e.g., 12500"
              className={errors.requested_share_amount ? 'border-red-500' : ''}
            />
            {errors.requested_share_amount && (
              <p className="text-red-500 text-sm">{errors.requested_share_amount}</p>
            )}
            {form.getValues('total_flight_cost') > 0 && form.getValues('requested_share_amount') > 0 && (
              <p className="text-sm text-muted-foreground">
                Share percentage: {((form.getValues('requested_share_amount') / form.getValues('total_flight_cost')) * 100).toFixed(0)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Offer'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
} 