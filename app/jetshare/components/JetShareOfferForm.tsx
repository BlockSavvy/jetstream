'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plane, DollarSign, ArrowRight, Loader2, Users, UserPlus } from 'lucide-react';
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
import { format, addHours } from 'date-fns';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/components/auth-provider';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import AircraftModelSelector from './AircraftModelSelector';

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
  total_seats: z.number().int().min(1, {
    message: "Total seats must be at least 1",
  }),
  available_seats: z.number().int().min(1, {
    message: "Available seats must be at least 1",
  }),
  total_flight_cost: z.union([
    z.string().min(1, { message: "Total flight cost is required" }),
    z.number().int().positive({
      message: "Total flight cost must be a positive integer",
    })
  ]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
  requested_share_amount: z.union([
    z.string().min(1, { message: "Requested share amount is required" }),
    z.number().int().positive({
      message: "Requested share amount must be a positive integer",
    })
  ]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val)
});

// Additional validation to ensure requested amount <= total cost
const enhancedFormSchema = formSchema.refine(
  (data) => {
    // Convert to numbers for comparison
    const requestedAmount = Number(data.requested_share_amount);
    const totalCost = Number(data.total_flight_cost);
    return !isNaN(requestedAmount) && !isNaN(totalCost) && requestedAmount <= totalCost;
  },
  {
    message: "Requested share amount cannot exceed total flight cost",
    path: ["requested_share_amount"],
  }
);

// Add these autocomplete city/airport constants
const POPULAR_AIRPORTS = [
  "New York (JFK)",
  "Los Angeles (LAX)",
  "Miami (MIA)",
  "Chicago (ORD)",
  "San Francisco (SFO)",
  "Denver (DEN)",
  "Las Vegas (LAS)",
  "Dallas (DFW)",
  "Boston (BOS)",
  "Seattle (SEA)",
  "Atlanta (ATL)",
  "Houston (IAH)",
  "London (LHR)",
  "Paris (CDG)",
  "Tokyo (HND)",
  "Dubai (DXB)",
  "Hong Kong (HKG)",
  "Sydney (SYD)",
  "Singapore (SIN)",
  "Toronto (YYZ)"
];

const POPULAR_AIRCRAFT = [
  "Gulfstream G650",
  "Bombardier Global 7500",
  "Dassault Falcon 8X",
  "Cessna Citation Longitude",
  "Embraer Phenom 300",
  "Pilatus PC-24",
  "Beechcraft King Air 350i",
  "Bombardier Challenger 350",
  "Bombardier Challenger 650",
  "Dassault Falcon 2000LXS",
  "Gulfstream G280",
  "Gulfstream G550"
];

// Add a new interface for aircraft models
interface AircraftModel {
  id: string;
  manufacturer: string;
  model: string;
  display_name: string;
  seat_capacity: number;
  range_nm?: number;
  cruise_speed_kts?: number;
  image_url?: string;
  description?: string;
}

export default function JetShareOfferForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  
  // Add state to control autocomplete visibility
  const [departureResults, setDepartureResults] = useState<string[]>([]);
  const [arrivalResults, setArrivalResults] = useState<string[]>([]);
  const [showDepartureResults, setShowDepartureResults] = useState(false);
  const [showArrivalResults, setShowArrivalResults] = useState(false);

  // Check for authentication on load
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to create a jet share offer');
      router.push('/auth/login?returnUrl=' + encodeURIComponent(window.location.href));
    }
  }, [user, router]);
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof enhancedFormSchema>>({
    resolver: zodResolver(enhancedFormSchema),
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

  // Validate values when form changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Handle changes to total seats
      if (name === 'total_seats') {
        const total = value.total_seats as number;
        const available = value.available_seats as number;
        if (available > total) {
          form.setValue('available_seats', Math.floor(total / 2));
        }
      }
      
      // Handle changes to requested_share_amount
      if (name === 'requested_share_amount') {
        const amount = value.requested_share_amount as number;
        const totalCost = value.total_flight_cost as number;
        
        // Ensure the requested amount doesn't exceed the total cost
        if (amount > totalCost && totalCost > 0) {
          form.setValue('requested_share_amount', totalCost);
        }
      }
      
      // Handle changes to total_flight_cost
      if (name === 'total_flight_cost') {
        const totalCost = value.total_flight_cost as number;
        const amount = value.requested_share_amount as number;
        
        // Ensure the requested amount doesn't exceed the total cost
        if (amount > totalCost && totalCost > 0) {
          form.setValue('requested_share_amount', totalCost);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Watch total flight cost to calculate the share amount
  const totalFlightCost = form.watch('total_flight_cost');
  const requestedShareAmount = form.watch('requested_share_amount');
  
  // Calculate share percentage safely
  const sharePercentage = (totalFlightCost && requestedShareAmount && totalFlightCost > 0) 
    ? Math.min(100, Math.max(0, Math.round((Number(requestedShareAmount) / Number(totalFlightCost) * 100))))
    : 50;
  
  // Update share amount when total cost or percentage changes
  const updateShareAmount = (percentage: number) => {
    if (!totalFlightCost || isNaN(Number(totalFlightCost)) || Number(totalFlightCost) <= 0) {
      return;
    }
    
    const newAmount = Math.round(Number(totalFlightCost) * (percentage / 100));
    form.setValue('requested_share_amount', newAmount > 0 ? newAmount : 1);
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof enhancedFormSchema>) => {
    // Validate available seats one more time before submission
    if (values.available_seats > values.total_seats) {
      form.setError('available_seats', {
        type: 'manual',
        message: 'Available seats cannot exceed total seats',
      });
      return;
    }

    // Validate that total_flight_cost is a valid number
    const totalCost = Number(values.total_flight_cost);
    if (isNaN(totalCost) || totalCost <= 0) {
      form.setError('total_flight_cost', {
        type: 'manual',
        message: 'Total flight cost must be a positive number',
      });
      return;
    }

    // Validate that requested_share_amount is valid
    const shareAmount = Number(values.requested_share_amount);
    if (isNaN(shareAmount) || shareAmount <= 0 || shareAmount > totalCost) {
      form.setError('requested_share_amount', {
        type: 'manual',
        message: 'Requested share amount must be positive and not exceed total cost',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if user is authenticated
      if (!user) {
        toast.error('You must be signed in to create an offer');
        router.push('/auth/login?returnUrl=' + encodeURIComponent(window.location.href));
        return;
      }
      
      // Format the date for the API
      const formattedValues = {
        ...values,
        // Ensure numbers are properly formatted as integers
        total_flight_cost: Number(values.total_flight_cost),
        requested_share_amount: Number(values.requested_share_amount),
        total_seats: Number(values.total_seats),
        available_seats: Number(values.available_seats),
        flight_date: values.flight_date.toISOString(),
        status: 'open',
        matched_user_id: null,
      };
      
      // Submit the form data using API endpoint instead of direct Supabase access
      const response = await fetch('/api/jetshare/createOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create offer');
      }
      
      // Show success message
      toast.success('Flight share offer created successfully!');
      
      // Redirect to the listings page
      router.push('/jetshare/listings');
    } catch (error) {
      console.error('Error creating offer:', error);
      
      // Provide a more descriptive error message
      let errorMessage = 'Failed to create offer';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add more context for specific errors
        if (errorMessage.includes('profile')) {
          errorMessage = 'Unable to create offer: Your user profile is missing. Please try signing out and back in.';
        } else if (errorMessage.includes('foreign key')) {
          errorMessage = 'Unable to create offer: There was a database constraint error. Please try again or contact support.';
        } else if (errorMessage.includes('authenticate') || errorMessage.includes('auth')) {
          errorMessage = 'Authentication failed. Please sign in again to create an offer.';
        }
      }
      
      toast.error(errorMessage);
      
      // If auth error, redirect to login
      if (error instanceof Error && 
          (error.message.includes('auth') || 
           error.message.includes('sign') || 
           error.message.includes('JWT'))) {
        router.push('/auth/login?returnUrl=' + encodeURIComponent(window.location.href));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add autocomplete handler functions
  const handleDepartureSearch = (value: string) => {
    form.setValue("departure_location", value);
    // Filter airports based on input
    if (value.length > 1) {
      const filtered = POPULAR_AIRPORTS.filter(
        airport => airport.toLowerCase().includes(value.toLowerCase())
      );
      setDepartureResults(filtered);
      setShowDepartureResults(filtered.length > 0);
    } else {
      setDepartureResults([]);
      setShowDepartureResults(false);
    }
  };
  
  const handleArrivalSearch = (value: string) => {
    form.setValue("arrival_location", value);
    // Filter airports based on input
    if (value.length > 1) {
      const filtered = POPULAR_AIRPORTS.filter(
        airport => airport.toLowerCase().includes(value.toLowerCase())
      );
      setArrivalResults(filtered);
      setShowArrivalResults(filtered.length > 0);
    } else {
      setArrivalResults([]);
      setShowArrivalResults(false);
    }
  };
  
  // Function to select from autocomplete results
  const selectDepartureLocation = (location: string) => {
    form.setValue("departure_location", location);
    setShowDepartureResults(false);
  };
  
  const selectArrivalLocation = (location: string) => {
    form.setValue("arrival_location", location);
    setShowArrivalResults(false);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
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
                        "pl-3 text-left font-normal w-full md:w-auto",
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
                Select the date of your flight (future dates only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departure Location with Autocomplete */}
          <FormField
            control={form.control}
            name="departure_location"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Departure Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="City or airport"
                      className="pl-10"
                      {...field}
                      onChange={(e) => handleDepartureSearch(e.target.value)}
                      onFocus={() => setShowDepartureResults(departureResults.length > 0)}
                      onBlur={() => {
                        // Delay hiding to allow for selection
                        setTimeout(() => setShowDepartureResults(false), 200);
                      }}
                    />
                  </div>
                </FormControl>
                {showDepartureResults && departureResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 mt-1 rounded-md border shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {departureResults.map((location, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onMouseDown={() => selectDepartureLocation(location)}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <FormDescription>
                  Enter the city or airport name for departure
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Arrival Location with Autocomplete */}
          <FormField
            control={form.control}
            name="arrival_location"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Arrival Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 rotate-90 text-muted-foreground" />
                    <Input
                      placeholder="City or airport"
                      className="pl-10"
                      {...field}
                      onChange={(e) => handleArrivalSearch(e.target.value)}
                      onFocus={() => setShowArrivalResults(arrivalResults.length > 0)}
                      onBlur={() => {
                        // Delay hiding to allow for selection
                        setTimeout(() => setShowArrivalResults(false), 200);
                      }}
                    />
                  </div>
                </FormControl>
                {showArrivalResults && arrivalResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 mt-1 rounded-md border shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {arrivalResults.map((location, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onMouseDown={() => selectArrivalLocation(location)}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <FormDescription>
                  Enter the city or airport name for arrival
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Aircraft Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aircraft Model with Autocomplete */}
          <FormField
            control={form.control}
            name="aircraft_model"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Aircraft Model</FormLabel>
                <FormControl>
                  <AircraftModelSelector
                    value={field.value}
                    onChange={(value, seatCapacity) => {
                      field.onChange(value);
                      
                      // If seat capacity is provided, update related fields
                      if (seatCapacity) {
                        form.setValue('total_seats', seatCapacity);
                        // Set available seats to half or a reasonable value
                        const newAvailableSeats = Math.ceil(seatCapacity / 2);
                        form.setValue('available_seats', newAvailableSeats);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Select the aircraft model for your flight share
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
                        field.onChange(isNaN(value) ? 1 : Math.max(1, value));
                        
                        // Update available seats to maintain 50/50 split (rounded down)
                        const newAvailableSeats = Math.max(1, Math.floor(value / 2));
                        form.setValue('available_seats', newAvailableSeats);
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Total seats in the aircraft (minimum 1)
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
                        
                        // Ensure value is at least 1 and no more than total seats
                        field.onChange(isNaN(value) ? 1 : Math.min(Math.max(1, value), totalSeats));
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Number of seats available for sharing (cannot exceed total seats)
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
              <FormLabel>Total Flight Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    placeholder="25000"
                    className="pl-10"
                    {...field}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      // Only allow positive integers or clear the field
                      const value = rawValue === '' ? '' : Math.floor(Math.abs(parseFloat(rawValue)));
                      
                      // Set the raw integer value directly to avoid floating point issues
                      field.onChange(value === '' ? '' : value);
                      
                      // Only update share amount if we have a valid positive number
                      if (value && typeof value === 'number' && value > 0) {
                        // Calculate platform fee (7.5% is the default handling fee)
                        const platformFee = value * 0.075;
                        
                        // Preserve the current percentage if available, otherwise default to 50%
                        const currentPercentage = totalFlightCost && totalFlightCost > 0 
                          ? (requestedShareAmount / totalFlightCost * 100)
                          : 50;
                          
                        // Calculate new share amount based on the percentage
                        const newShareAmount = Math.round(value * (currentPercentage / 100));
                        
                        // Ensure the share amount is valid
                        const validShareAmount = Math.min(value, Math.max(1, newShareAmount));
                        form.setValue('requested_share_amount', validShareAmount);
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the total cost of your private jet flight
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
                  <span className="text-sm text-muted-foreground">
                    Percentage: {sharePercentage}%
                  </span>
                  <span className="font-medium">
                    ${typeof field.value === 'number' ? field.value.toLocaleString() : Number(field.value).toLocaleString()}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    defaultValue={[50]}
                    max={100}
                    min={1}
                    step={1}
                    value={[sharePercentage]}
                    onValueChange={(values) => {
                      updateShareAmount(values[0]);
                    }}
                    className="cursor-pointer"
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <FormDescription>
                Select how much of your total cost you'd like to offset by sharing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 sm:py-4 md:py-6 h-auto text-lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating offer...
            </>
          ) : (
            <>
              Create Flight Share Offer
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
} 