'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plane, DollarSign, ArrowRight, Loader2, Clock, Users, UserPlus } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, addHours } from 'date-fns';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

interface OfferCreationFormProps {
  user: User | null;
}

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
  aircraft_model: z.string().min(2, {
    message: "Aircraft model is required",
  }),
  total_seats: z.number().min(1, {
    message: "Total seats must be at least 1",
  }),
  available_seats: z.number().min(1, {
    message: "Available seats must be at least 1",
  }),
  total_flight_cost: z.number().positive({
    message: "Total flight cost must be greater than 0",
  }),
  requested_share_amount: z.number().positive({
    message: "Requested share amount must be greater than 0",
  }),
});

export default function OfferCreationForm({ user }: OfferCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flight_date: addHours(new Date(), 24), // Default to tomorrow
      departure_location: "",
      arrival_location: "",
      aircraft_model: "",
      total_seats: 8, // Default for a typical private jet
      available_seats: 4, // Default to half the seats
      total_flight_cost: 25000, // Default value
      requested_share_amount: 12500, // Default to 50%
    },
  });

  // Watch values for validation
  const totalSeats = form.watch('total_seats');
  const availableSeats = form.watch('available_seats');

  // Validate available seats whenever total seats changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'total_seats') {
        const total = value.total_seats as number;
        const available = value.available_seats as number;
        if (available > total) {
          form.setValue('available_seats', Math.floor(total / 2));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Watch total flight cost to calculate the share amount
  const totalFlightCost = form.watch('total_flight_cost');
  const requestedShareAmount = form.watch('requested_share_amount');
  const sharePercentage = totalFlightCost > 0 
    ? (requestedShareAmount / totalFlightCost * 100) 
    : 50;
  
  // Update share amount when total cost or percentage changes
  const updateShareAmount = (percentage: number) => {
    if (totalFlightCost) {
      form.setValue('requested_share_amount', Math.round(totalFlightCost * (percentage / 100)));
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate available seats one more time before submission
    if (values.available_seats > values.total_seats) {
      form.setError('available_seats', {
        type: 'manual',
        message: 'Available seats cannot exceed total seats',
      });
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create an offer');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the date for the API
      const formattedValues = {
        ...values,
        flight_date: values.flight_date.toISOString(),
        status: 'open',
        matched_user_id: null,
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
      
      // Redirect to the listings page where the user can see all offers including their own
      router.push('/jetshare');
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="pt-6">
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
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date of your flight. Only future dates are allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          Enter the city or airport name for departure.
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
                          Enter the city or airport name for arrival.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Aircraft Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aircraft Model */}
                  <FormField
                    control={form.control}
                    name="aircraft_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aircraft Model</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g., Gulfstream G650"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the model of your private jet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total Seats */}
                  <FormField
                    control={form.control}
                    name="total_seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Seats</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min={1}
                              placeholder="8"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 1 : value);
                                
                                // Update available seats to maintain 50/50 split
                                const newAvailableSeats = Math.floor(value / 2);
                                form.setValue('available_seats', newAvailableSeats);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Total number of seats in the aircraft
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Available Seats */}
                  <FormField
                    control={form.control}
                    name="available_seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Seats</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min={1}
                              max={form.watch('total_seats')}
                              placeholder="4"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                const totalSeats = form.watch('total_seats');
                                field.onChange(isNaN(value) ? 1 : Math.min(value, totalSeats));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Number of seats available for sharing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Total Flight Cost */}
                <FormField
                  control={form.control}
                  name="total_flight_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Flight Cost ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1000}
                            step={500}
                            className="pl-10"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                              
                              // Adjust share amount to maintain the percentage
                              if (value > 0) {
                                form.setValue('requested_share_amount', Math.round(value * (sharePercentage / 100)));
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The total cost you paid for the entire flight.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Share Amount Slider */}
                <FormField
                  control={form.control}
                  name="requested_share_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Share Amount (${field.value.toLocaleString()} - {sharePercentage.toFixed(0)}%)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Slider
                            defaultValue={[50]}
                            max={100}
                            step={1}
                            value={[sharePercentage]}
                            onValueChange={(value) => updateShareAmount(value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Adjust the percentage of the flight cost you want to share.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Offer...
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
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar with explanation */}
      <div className="lg:col-span-1">
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-none">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-4">How JetShare Works</h3>
            
            <div className="space-y-6">
              <div className="flex">
                <div className="mr-4 mt-1">
                  <div className="bg-amber-100 dark:bg-amber-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                    <Plane className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Create an Offer</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Fill in the details of your private jet flight and specify how much of the cost you want to share.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 mt-1">
                  <div className="bg-amber-100 dark:bg-amber-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Await Passengers</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Your offer will be visible to verified JetShare users who can accept your offer.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 mt-1">
                  <div className="bg-amber-100 dark:bg-amber-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Receive Payment</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Once someone accepts your offer, you'll receive payment directly, minus a small 7.5% handling fee.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 