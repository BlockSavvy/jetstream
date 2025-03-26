'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plane, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Define form schema with zod
const formSchema = z.object({
  flight_date: z.date({
    required_error: "Flight date and time is required",
  }),
  departure_location: z.string().min(2, {
    message: "Departure location must be at least 2 characters",
  }),
  arrival_location: z.string().min(2, {
    message: "Arrival location must be at least 2 characters",
  }),
  total_flight_cost: z.number().positive({
    message: "Total flight cost must be greater than 0",
  }),
  requested_share_amount: z.number().positive({
    message: "Requested share amount must be greater than 0",
  }),
});

export default function JetShareOfferForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flight_date: undefined,
      departure_location: "",
      arrival_location: "",
      total_flight_cost: 0,
      requested_share_amount: 0,
    },
  });
  
  // Watch total flight cost to calculate the share amount
  const totalFlightCost = form.watch('total_flight_cost');
  const sharePercentage = form.watch('requested_share_amount') / totalFlightCost * 100 || 50;
  
  // Update share amount when total cost or percentage changes
  const updateShareAmount = (percentage: number) => {
    if (totalFlightCost) {
      form.setValue('requested_share_amount', Math.round(totalFlightCost * (percentage / 100)));
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Format the date for the API
      const formattedValues = {
        ...values,
        flight_date: values.flight_date.toISOString(),
      };
      
      // Submit the form data to the API
      const response = await fetch('/api/jetshare/createOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Show success message
      toast.success('Flight share offer created successfully!');
      
      // Redirect to the dashboard
      router.push('/dashboard/jetshare');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Initialize Google Places Autocomplete
  const initializeGooglePlaces = (inputRef: HTMLInputElement | null, fieldName: "departure_location" | "arrival_location") => {
    if (!inputRef || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef, {
      types: ['airport', '(cities)'],
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name) {
        form.setValue(fieldName, place.name);
      }
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Flight Date and Time */}
        <FormField
          control={form.control}
          name="flight_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Flight Date & Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The date and approximate time of your flight.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Departure Location */}
        <FormField
          control={form.control}
          name="departure_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departure Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City or airport"
                    className="pl-10"
                    {...field}
                    ref={(inputRef) => initializeGooglePlaces(inputRef, "departure_location")}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the city or airport name where your flight will depart from.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Arrival Location */}
        <FormField
          control={form.control}
          name="arrival_location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arrival Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 rotate-90 text-muted-foreground" />
                  <Input
                    placeholder="City or airport"
                    className="pl-10"
                    {...field}
                    ref={(inputRef) => initializeGooglePlaces(inputRef, "arrival_location")}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the city or airport name where your flight will arrive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Total Flight Cost */}
        <FormField
          control={form.control}
          name="total_flight_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Flight Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    className="pl-10"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                      
                      // Update requested share amount to maintain percentage
                      if (sharePercentage && !isNaN(value)) {
                        form.setValue('requested_share_amount', Math.round(value * (sharePercentage / 100)));
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the total cost you paid for the private jet flight.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Desired Cost Offset */}
        <FormField
          control={form.control}
          name="requested_share_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desired Cost Offset</FormLabel>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Percentage: {Math.round(sharePercentage)}%</span>
                  <span className="font-medium">${field.value}</span>
                </div>
                <FormControl>
                  <Slider
                    defaultValue={[50]}
                    max={100}
                    step={1}
                    value={[sharePercentage]}
                    onValueChange={(values) => {
                      updateShareAmount(values[0]);
                    }}
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <FormDescription>
                Select how much of your total cost you'd like to offset by sharing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating offer...
            </>
          ) : (
            <>
              Create Flight Share Offer
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
} 