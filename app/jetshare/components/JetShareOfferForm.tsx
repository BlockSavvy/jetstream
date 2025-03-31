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

// Add interface for Airport type
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
}

export default function JetShareOfferForm({ airportsList = [] as Airport[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, loading: authLoading } = useAuth();
  
  // Add state to control autocomplete visibility
  const [departureResults, setDepartureResults] = useState<string[]>([]);
  const [arrivalResults, setArrivalResults] = useState<string[]>([]);
  const [showDepartureResults, setShowDepartureResults] = useState(false);
  const [showArrivalResults, setShowArrivalResults] = useState(false);

  // Check for authentication on load
  useEffect(() => {
    // Wait for auth to complete loading
    if (authLoading) {
      return;
    }
    
    // Auth has loaded, update state
    setIsAuthenticating(false);
    
    // If no authenticated user, redirect to login
    if (!user) {
      console.log('JetShareOfferForm: No authenticated user, redirecting to login');
      toast.error('Please sign in to create a flight share offer');
      
      // Encode the current URL to return after login
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    } else {
      console.log('JetShareOfferForm: User authenticated, can proceed', user.id);
      
      // Private browsing session handling - enable direct form submission without session validation
      // This bypasses the session check in private browsing scenarios or when cookies are blocked
      
      // Add some state to track if we're working with private browsing or limited cookie scenarios
      // This will allow us to continue anyway if we have a user object but no proper session
      
      let privateMode = false;
      try {
        // Try to detect private browsing mode by testing localStorage access (not 100% reliable)
        localStorage.setItem('__test_private_mode', '1');
        localStorage.removeItem('__test_private_mode');
        
        // If we suspect private browsing due to limited cookies, set a flag
        if (!document.cookie) {
          console.log('JetShareOfferForm: Limited or no cookies available - possible private browsing');
          privateMode = true;
        }
      } catch (e) {
        console.log('JetShareOfferForm: Storage access failed - likely private browsing');
        privateMode = true;
      }
      
      if (privateMode) {
        console.log('JetShareOfferForm: Operating in private browsing compatibility mode');
        // In private mode, we'll rely solely on the user object from auth context
        // No additional session validation to avoid redirect loops
        return;
      }
      
      // Only perform session validation in normal browsing mode where it's expected to work
      const checkSession = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.access_token) {
            console.log('JetShareOfferForm: No valid session token found, trying to refresh...');
            
            // Try to refresh the session before showing an error
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session?.access_token) {
              console.log('JetShareOfferForm: Session refreshed successfully');
              return; // Session refresh worked, no need to redirect
            }
            
            // Only show error after refresh attempt fails
            console.error('JetShareOfferForm: No valid session token found after refresh attempt');
            toast.error('Your session needs to be refreshed. Redirecting to login...', {
              duration: 3000,
              action: {
                label: 'Cancel',
                onClick: () => {
                  console.log('JetShareOfferForm: User canceled redirect - continuing in limited mode');
                  // User chose to continue anyway - we'll try to work with what we have
                }
              }
            });
            
            // Delay the redirect slightly to allow the user to see the toast and potentially cancel
            // This also increases chances of the refresh working in the background
            setTimeout(() => {
              router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            }, 3000);
          } else {
            console.log('JetShareOfferForm: Valid session token found');
          }
        } catch (err) {
          console.error('Error checking session:', err);
        }
      };
      
      checkSession();
    }
  }, [user, authLoading, router, supabase.auth]);
  
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
      requested_share_amount: 12500, // Default to 50
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
      // If the user is still null at this point, we should check the session again
      if (!user) {
        console.log('User is still null, attempting to get user ID from session');
        // Attempt to get user ID from the session
        const { data } = await supabase.auth.getSession();
        const sessionUserId = data.session?.user?.id;
        
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
          // Include user ID from session if available, or null if not
          user_id: sessionUserId || null
        };
        
        // Prepare request headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Submit the form data using API endpoint
        const response = await fetch('/api/jetshare/createOffer', {
          method: 'POST',
          headers,
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(formattedValues),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          // Handle different error scenarios
          if (response.status === 401) {
            // Auth error
            if (responseData.code === 'AUTH_TOKEN_EXPIRED') {
              toast.error('Your session has expired. Attempting to refresh...', {
                duration: 5000,
                description: 'Please wait a moment'
              });
              
              // Try to refresh the session before redirecting
              try {
                const { data } = await supabase.auth.refreshSession();
                if (data.session) {
                  // Session refreshed, retry submission
                  toast.success('Session refreshed');
                  setIsSubmitting(false);
                  // Wait a moment for auth state to update
                  setTimeout(() => onSubmit(values), 1000);
                  return;
                } else {
                  // If refresh failed, then redirect
                  toast.error('Unable to refresh session. Please sign in again.', {
                    duration: 5000,
                    description: 'After signing in, you will be returned to this page'
                  });
                }
              } catch (refreshError) {
                console.error('Error refreshing session:', refreshError);
                toast.error('Unable to refresh your session. Please sign in again.', {
                  duration: 5000,
                  description: 'After signing in, you will be returned to this page'
                });
              }
            } else if (responseData.code === 'INVALID_USER_ID') {
              toast.error('Authentication error. Please try again in a regular browser window.', {
                duration: 5000,
                description: 'Private browsing may limit functionality'
              });
            } else {
              toast.error('Authentication error. Please sign in again.', {
                duration: 5000
              });
            }
            
            // If we got a redirect URL, use it
            if (responseData.redirectUrl) {
              console.log('Redirecting to:', responseData.redirectUrl);
              router.push(responseData.redirectUrl);
              return;
            }
            
            // Default redirect
            router.push('/auth/login?returnUrl=' + encodeURIComponent(window.location.href));
            return;
          } else if (response.status === 400) {
            // Validation error
            toast.error('Please check your form inputs', {
              description: responseData.message || 'Some fields need correction'
            });
            // Highlight specific form errors if possible
            if (responseData.details) {
              Object.entries(responseData.details).forEach(([field, message]) => {
                if (form.getValues(field as any) !== undefined) {
                  form.setError(field as any, { 
                    type: 'manual', 
                    message: message as string 
                  });
                }
              });
            }
            return;
          } else {
            // Generic server error
            toast.error(responseData.message || 'Failed to create offer. Please try again.', {
              duration: 5000
            });
          }
          
          throw new Error(responseData.message || 'Failed to create offer');
        }
        
        // Show success message
        toast.success('Flight share offer created successfully!', {
          description: 'Your offer is now live and visible to potential matches'
        });
        
        // Redirect to the listings page
        router.push('/jetshare/listings');
      } else {
        // User is available, use their ID for the submission
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
          // Use the user ID from the user object
          user_id: user.id
        };
        
        // Get fresh auth session with token
        let token = null;
        
        // In normal browsing mode, try to get a token
        if (!isAuthenticating) {
          const { data: sessionData } = await supabase.auth.getSession();
          token = sessionData?.session?.access_token;
          
          // If no token is found, try refreshing the session
          if (!token) {
            console.log('No auth token available, attempting to refresh session...');
            const { data: refreshData } = await supabase.auth.refreshSession();
            token = refreshData?.session?.access_token;
          }
        }

        // Prepare request headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add auth token if available (may not be in private browsing)
        if (token) {
          console.log('Submitting offer with auth token:', token.substring(0, 10) + '...');
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.log('Submitting offer without auth token (private browsing mode)');
        }
        
        // Submit the form data using API endpoint
        const response = await fetch('/api/jetshare/createOffer', {
          method: 'POST',
          headers,
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(formattedValues),
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          // Handle different error scenarios
          if (response.status === 401) {
            // Auth error
            if (responseData.code === 'AUTH_TOKEN_EXPIRED') {
              toast.error('Your session has expired. Attempting to refresh...', {
                duration: 5000,
                description: 'Please wait a moment'
              });
              
              // Try to refresh the session before redirecting
              try {
                const { data } = await supabase.auth.refreshSession();
                if (data.session) {
                  // Session refreshed, retry submission
                  toast.success('Session refreshed');
                  setIsSubmitting(false);
                  // Wait a moment for auth state to update
                  setTimeout(() => onSubmit(values), 1000);
                  return;
                } else {
                  // If refresh failed, then redirect
                  toast.error('Unable to refresh session. Please sign in again.', {
                    duration: 5000,
                    description: 'After signing in, you will be returned to this page'
                  });
                }
              } catch (refreshError) {
                console.error('Error refreshing session:', refreshError);
                toast.error('Unable to refresh your session. Please sign in again.', {
                  duration: 5000,
                  description: 'After signing in, you will be returned to this page'
                });
              }
            } else if (responseData.code === 'INVALID_USER_ID') {
              toast.error('Authentication error. Please try again in a regular browser window.', {
                duration: 5000,
                description: 'Private browsing may limit functionality'
              });
            } else {
              toast.error('Authentication error. Please sign in again.', {
                duration: 5000
              });
            }
            
            // If we got a redirect URL, use it
            if (responseData.redirectUrl) {
              console.log('Redirecting to:', responseData.redirectUrl);
              router.push(responseData.redirectUrl);
              return;
            }
            
            // Default redirect
            router.push('/auth/login?returnUrl=' + encodeURIComponent(window.location.href));
            return;
          } else if (response.status === 400) {
            // Validation error
            toast.error('Please check your form inputs', {
              description: responseData.message || 'Some fields need correction'
            });
            // Highlight specific form errors if possible
            if (responseData.details) {
              Object.entries(responseData.details).forEach(([field, message]) => {
                if (form.getValues(field as any) !== undefined) {
                  form.setError(field as any, { 
                    type: 'manual', 
                    message: message as string 
                  });
                }
              });
            }
            return;
          } else {
            // Generic server error
            toast.error(responseData.message || 'Failed to create offer. Please try again.', {
              duration: 5000
            });
          }
          
          throw new Error(responseData.message || 'Failed to create offer');
        }
        
        // Show success message
        toast.success('Flight share offer created successfully!', {
          description: 'Your offer is now live and visible to potential matches'
        });
        
        // Redirect to the listings page
        router.push('/jetshare/listings');
      }
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
      let filtered = [];
      
      // Check if we have airports from API to use
      if (airportsList && airportsList.length > 0) {
        filtered = airportsList.filter(
          airport => {
            const searchLower = value.toLowerCase();
            return (
              airport.code.toLowerCase().includes(searchLower) || 
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower)
            );
          }
        ).map(airport => `${airport.city} (${airport.code})`);
      } else {
        // Fallback to POPULAR_AIRPORTS
        filtered = POPULAR_AIRPORTS.filter(
          airport => airport.toLowerCase().includes(value.toLowerCase())
        );
      }
      
      // Limit results to 10 for better UX
      filtered = filtered.slice(0, 10);
      
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
      let filtered = [];
      
      // Check if we have airports from API to use
      if (airportsList && airportsList.length > 0) {
        filtered = airportsList.filter(
          airport => {
            const searchLower = value.toLowerCase();
            return (
              airport.code.toLowerCase().includes(searchLower) || 
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower)
            );
          }
        ).map(airport => `${airport.city} (${airport.code})`);
      } else {
        // Fallback to POPULAR_AIRPORTS
        filtered = POPULAR_AIRPORTS.filter(
          airport => airport.toLowerCase().includes(value.toLowerCase())
        );
      }
      
      // Limit results to 10 for better UX
      filtered = filtered.slice(0, 10);
      
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
  
  // Show loading state while authentication is in progress
  if (isAuthenticating || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Verifying authentication...</p>
      </div>
    );
  }
  
  // Show error state if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 mb-6 rounded-full bg-red-100 text-red-500">
          <UserPlus className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
          You need to be signed in to create a flight share offer. Please sign in or create an account to continue.
        </p>
        <Button
          onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
          className="mb-4"
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/jetshare')}
        >
          Return to JetShare Home
        </Button>
      </div>
    );
  }
  
  // Continue with the normal form render if authenticated
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        {/* Flight Date and Time */}
        <FormField
          control={form.control}
          name="flight_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel htmlFor="flight_date">Flight Date & Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      id="flight_date"
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
                <FormLabel htmlFor="departure_location">Departure Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="departure_location"
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
                <FormLabel htmlFor="arrival_location">Arrival Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="arrival_location"
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
                <FormLabel htmlFor="aircraft_model">Aircraft Model</FormLabel>
                <FormControl>
                  <AircraftModelSelector
                    id="aircraft_model"
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
                <FormLabel htmlFor="total_seats">Total Seats</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="total_seats"
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
                <FormLabel htmlFor="available_seats">Available Seats</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="available_seats"
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
              <FormLabel htmlFor="total_flight_cost">Total Flight Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="total_flight_cost"
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
                        
                        // Preserve the current percentage if available, otherwise default to 50
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
              <FormLabel htmlFor="requested_share_amount_slider">Desired Cost Offset</FormLabel>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Percentage: {sharePercentage}
                  </span>
                  <span className="font-medium">
                    ${typeof field.value === 'number' ? field.value.toLocaleString() : Number(field.value).toLocaleString()}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    id="requested_share_amount_slider"
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