'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plane, Home, Sofa, Settings, X } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import '../../gdyup.css';

// Step schemas
const jetDetailsSchema = z.object({
  manufacturer: z.string().min(1, { message: "Manufacturer is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.string().min(4, { message: "Year is required" }),
  tailNumber: z.string().min(1, { message: "Tail number is required" }),
  category: z.enum(["light", "midsize", "super_midsize", "heavy"]),
  description: z.string().optional(),
  cruiseSpeedKts: z.string().optional(),
  rangeNm: z.string().optional(),
});

const seatLayoutSchema = z.object({
  layoutType: z.enum(["standard", "luxury", "custom"]),
  totalSeats: z.string().min(1, { message: "Number of seats is required" }),
  requestCustomLayout: z.boolean().optional(),
  customLayoutNotes: z.string().optional(),
});

const interiorDetailsSchema = z.object({
  interiorType: z.string().min(1, { message: "Interior type is required" }),
  berths: z.boolean().optional(),
  lavatory: z.boolean().optional(),
  galley: z.boolean().optional(),
  entertainment: z.string().optional(),
  wifi: z.boolean().optional(),
  notes: z.string().optional(),
});

const homeBaseSchema = z.object({
  homeBaseAirport: z.string().min(1, { message: "Home base airport is required" }),
  status: z.enum(["available", "maintenance", "reserved"]),
  hourlyRate: z.string().optional(),
});

// Form data types
type JetDetailsFormData = z.infer<typeof jetDetailsSchema>;
type SeatLayoutFormData = z.infer<typeof seatLayoutSchema>;
type InteriorDetailsFormData = z.infer<typeof interiorDetailsSchema>;
type HomeBaseFormData = z.infer<typeof homeBaseSchema>;

export default function AddJet() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [jetDetails, setJetDetails] = useState<JetDetailsFormData>({} as JetDetailsFormData);
  const [seatLayout, setSeatLayout] = useState<SeatLayoutFormData>({} as SeatLayoutFormData);
  const [interiorDetails, setInteriorDetails] = useState<InteriorDetailsFormData>({} as InteriorDetailsFormData);
  const [homeBase, setHomeBase] = useState<HomeBaseFormData>({} as HomeBaseFormData);
  const [jetId, setJetId] = useState('temp-id'); // Temporary ID for visualization
  const [modelDataLoaded, setModelDataLoaded] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

  // Form handlers for each step
  const jetDetailsForm = useForm<JetDetailsFormData>({
    resolver: zodResolver(jetDetailsSchema),
    defaultValues: {
      manufacturer: '',
      model: '',
      year: '',
      tailNumber: '',
      category: 'midsize',
      description: '',
      cruiseSpeedKts: '',
      rangeNm: '',
    },
  });

  const seatLayoutForm = useForm<SeatLayoutFormData>({
    resolver: zodResolver(seatLayoutSchema),
    defaultValues: {
      layoutType: 'standard',
      totalSeats: '',
      requestCustomLayout: false,
      customLayoutNotes: '',
    },
  });

  const interiorDetailsForm = useForm<InteriorDetailsFormData>({
    resolver: zodResolver(interiorDetailsSchema),
    defaultValues: {
      interiorType: 'Standard',
      berths: false,
      lavatory: false,
      galley: false,
      entertainment: '',
      wifi: false,
      notes: '',
    },
  });

  const homeBaseForm = useForm<HomeBaseFormData>({
    resolver: zodResolver(homeBaseSchema),
    defaultValues: {
      homeBaseAirport: '',
      status: 'available',
      hourlyRate: '',
    },
  });

  // Load aircraft model data from session storage if available
  useEffect(() => {
    if (typeof window !== 'undefined' && !modelDataLoaded) {
      const selectedModelJson = sessionStorage.getItem('selectedAircraftModel');
      
      if (selectedModelJson) {
        try {
          const selectedModel = JSON.parse(selectedModelJson);
          
          // Pre-fill the form with data from the selected model
          jetDetailsForm.setValue('manufacturer', selectedModel.manufacturer);
          jetDetailsForm.setValue('model', selectedModel.model);
          jetDetailsForm.setValue('description', selectedModel.description || '');
          jetDetailsForm.setValue('cruiseSpeedKts', selectedModel.cruise_speed_kts || '');
          jetDetailsForm.setValue('rangeNm', selectedModel.range_nm || '');
          
          // Set default category based on seat capacity
          const seatCapacity = parseInt(selectedModel.seat_capacity);
          let category: "light" | "midsize" | "super_midsize" | "heavy" = "midsize";
          
          if (seatCapacity <= 6) {
            category = "light";
          } else if (seatCapacity <= 9) {
            category = "midsize";
          } else if (seatCapacity <= 12) {
            category = "super_midsize";
          } else {
            category = "heavy";
          }
          
          jetDetailsForm.setValue('category', category);
          
          // Set total seats
          seatLayoutForm.setValue('totalSeats', selectedModel.seat_capacity);
          
          // Cleanup session storage
          sessionStorage.removeItem('selectedAircraftModel');
          setModelDataLoaded(true);
        } catch (error) {
          console.error('Error loading aircraft model data:', error);
        }
      }
    }
  }, [jetDetailsForm, seatLayoutForm, modelDataLoaded]);

  // Check for saved offline data on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedJetData = localStorage.getItem('offline_jet_form_data');
        if (savedJetData) {
          const shouldRestore = window.confirm(
            'We found a previously unsaved jet. Would you like to restore this data?'
          );
          
          if (shouldRestore) {
            const parsedData = JSON.parse(savedJetData);
            
            // Restore data to each form
            if (parsedData.jetDetails) {
              Object.entries(parsedData.jetDetails).forEach(([key, value]) => {
                jetDetailsForm.setValue(key as keyof JetDetailsFormData, value as any);
              });
              setJetDetails(parsedData.jetDetails);
            }
            
            if (parsedData.seatLayout) {
              Object.entries(parsedData.seatLayout).forEach(([key, value]) => {
                seatLayoutForm.setValue(key as keyof SeatLayoutFormData, value as any);
              });
              setSeatLayout(parsedData.seatLayout);
            }
            
            if (parsedData.interiorDetails) {
              Object.entries(parsedData.interiorDetails).forEach(([key, value]) => {
                interiorDetailsForm.setValue(key as keyof InteriorDetailsFormData, value as any);
              });
              setInteriorDetails(parsedData.interiorDetails);
            }
            
            if (parsedData.homeBase) {
              Object.entries(parsedData.homeBase).forEach(([key, value]) => {
                homeBaseForm.setValue(key as keyof HomeBaseFormData, value as any);
              });
              setHomeBase(parsedData.homeBase);
            }
            
            // Navigate to the last step they were on
            if (parsedData.step) {
              setStep(parsedData.step);
            }
            
            toast.success('Form data restored successfully!');
          } else {
            // Clear the saved data if they choose not to restore
            localStorage.removeItem('offline_jet_form_data');
          }
        }
      } catch (e) {
        console.error('Error restoring saved form data:', e);
      }
    }
  }, []);

  // Helper function to get user ID with fallbacks
  const getUserId = () => {
    // First try from auth context
    if (user?.id) {
      return user.id;
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedUserId = localStorage.getItem('jetstream_user_id');
        if (storedUserId) return storedUserId;
        
        // Try to extract from token data
        const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        if (tokenData) {
          const parsed = JSON.parse(tokenData);
          if (parsed?.user?.id) return parsed.user.id;
        }
      } catch (e) {
        console.warn('Error retrieving user ID from storage:', e);
      }
    }
    
    // If we couldn't find a user ID, return null
    return null;
  };

  // Handle submission for each step
  const handleJetDetailsSubmit = (data: JetDetailsFormData) => {
    setJetDetails(data);
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSeatLayoutSubmit = (data: SeatLayoutFormData) => {
    setSeatLayout(data);
    setStep(3);
    window.scrollTo(0, 0);
  };

  const handleInteriorDetailsSubmit = (data: InteriorDetailsFormData) => {
    setInteriorDetails(data);
    setStep(4);
    window.scrollTo(0, 0);
  };

  const handleHomeBaseSubmit = async (data: HomeBaseFormData) => {
    setHomeBase(data);
    setLoading(true);
    
    // Save all form data to localStorage before submission attempt
    if (typeof window !== 'undefined') {
      try {
        const formData = {
          jetDetails,
          seatLayout,
          interiorDetails,
          homeBase: data,
          step: 4
        };
        localStorage.setItem('offline_jet_form_data', JSON.stringify(formData));
      } catch (e) {
        console.warn('Failed to save form data to localStorage:', e);
      }
    }
    
    try {
      // Get user ID with fallbacks
      const userId = getUserId();
      
      // Check if user is logged in
      if (!userId && !process.env.NEXT_PUBLIC_BYPASS_AUTH) {
        toast.error('You must be logged in to add a jet');
        
        // Store current path for redirect back after login
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('authRedirectUrl', '/gdyup/jets/add');
          } catch (e) {
            console.error("Failed to save redirect URL:", e);
          }
        }
        
        setLoading(false);
        router.push('/auth/login?returnUrl=/gdyup/jets/add');
        return;
      }
      
      // Combine all form data
      const jetData = {
        ...jetDetails,
        ...seatLayout,
        ...interiorDetails,
        ...data,
        userId
      };
      
      // Get the auth token if available
      let authToken = null;
      if (typeof window !== 'undefined') {
        try {
          const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            authToken = parsed.access_token;
          }
        } catch (e) {
          console.warn('Error retrieving auth token:', e);
        }
      }
      
      // Prepare headers with authentication
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if token exists
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Submit to API
      const response = await fetch('/api/jets', {
        method: 'POST',
        headers,
        body: JSON.stringify(jetData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || 'Failed to add jet';
        throw new Error(errorMessage);
      }
      
      // On successful submission, clear saved form data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('offline_jet_form_data');
      }
      
      const result = await response.json();
      toast.success('Jet added successfully!');
      router.push(`/gdyup/jets/${result.id}`);
    } catch (error) {
      console.error('Error adding jet:', error);
      let errorMessage = 'Failed to add jet. Please try again.';
      
      if (error instanceof Error) {
        // Check for network/connection errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Connection error. Your data has been saved locally. You can try again when you have a better connection.';
          setIsOfflineSaved(true);
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Navigation between steps
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  // Calculate progress percentage
  const progress = (step / 4) * 100;
  
  // GDY UP brand colors
  const primaryColor = "#DAFF0D";
  const secondaryColor = "#FF4B47";

  // First step - Jet Details
  const renderJetDetailsStep = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-900 rounded-lg p-5 mb-5">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Plane className="mr-2 h-5 w-5 text-[#DAFF0D]" />
          Jet Details
        </h2>
        
        <form onSubmit={jetDetailsForm.handleSubmit(handleJetDetailsSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              placeholder="e.g., Gulfstream, Bombardier, Dassault"
              className="bg-gray-800 border-gray-700 text-white"
              {...jetDetailsForm.register('manufacturer')}
            />
            {jetDetailsForm.formState.errors.manufacturer && (
              <p className="text-[#FF4B47] text-sm">{jetDetailsForm.formState.errors.manufacturer.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="e.g., G650, Global 7500, Falcon 8X"
              className="bg-gray-800 border-gray-700 text-white"
              {...jetDetailsForm.register('model')}
            />
            {jetDetailsForm.formState.errors.model && (
              <p className="text-[#FF4B47] text-sm">{jetDetailsForm.formState.errors.model.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="e.g., 2020"
                type="number"
                className="bg-gray-800 border-gray-700 text-white"
                {...jetDetailsForm.register('year')}
              />
              {jetDetailsForm.formState.errors.year && (
                <p className="text-[#FF4B47] text-sm">{jetDetailsForm.formState.errors.year.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tailNumber">Tail Number</Label>
              <Input
                id="tailNumber"
                placeholder="e.g., N123AB"
                className="bg-gray-800 border-gray-700 text-white"
                {...jetDetailsForm.register('tailNumber')}
              />
              {jetDetailsForm.formState.errors.tailNumber && (
                <p className="text-[#FF4B47] text-sm">{jetDetailsForm.formState.errors.tailNumber.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Aircraft Category</Label>
            <Select 
              defaultValue="midsize" 
              onValueChange={(value) => jetDetailsForm.setValue('category', value as "light" | "midsize" | "super_midsize" | "heavy")}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="midsize">Midsize</SelectItem>
                <SelectItem value="super_midsize">Super Midsize</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cruiseSpeedKts">Cruise Speed (kts)</Label>
              <Input
                id="cruiseSpeedKts"
                placeholder="e.g., 500"
                type="number"
                className="bg-gray-800 border-gray-700 text-white"
                {...jetDetailsForm.register('cruiseSpeedKts')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rangeNm">Range (nm)</Label>
              <Input
                id="rangeNm"
                placeholder="e.g., 4000"
                type="number"
                className="bg-gray-800 border-gray-700 text-white"
                {...jetDetailsForm.register('rangeNm')}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of your aircraft"
              className="bg-gray-800 border-gray-700 text-white"
              {...jetDetailsForm.register('description')}
            />
          </div>
        
          {/* Fixed bottom navigation */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white"
              onClick={() => router.push('/gdyup/jets')}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  // Second step - Seat Layout
  const renderSeatLayoutStep = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-900 rounded-lg p-5 mb-5">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Sofa className="mr-2 h-5 w-5 text-[#DAFF0D]" />
          Seat Layout
        </h2>
        
        <form onSubmit={seatLayoutForm.handleSubmit(handleSeatLayoutSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalSeats">Total Number of Seats</Label>
            <Input
              id="totalSeats"
              placeholder="e.g., 8"
              type="number"
              className="bg-gray-800 border-gray-700 text-white"
              {...seatLayoutForm.register('totalSeats')}
            />
            {seatLayoutForm.formState.errors.totalSeats && (
              <p className="text-[#FF4B47] text-sm">{seatLayoutForm.formState.errors.totalSeats.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="layoutType">Layout Type</Label>
            <Select 
              defaultValue="standard" 
              onValueChange={(value) => seatLayoutForm.setValue('layoutType', value as "standard" | "luxury" | "custom")}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select layout type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="requestCustomLayout" 
              onCheckedChange={(checked) => seatLayoutForm.setValue('requestCustomLayout', checked as boolean)}
            />
            <Label htmlFor="requestCustomLayout" className="text-sm">
              Request custom layout configuration from GDY UP team
            </Label>
          </div>
          
          {seatLayoutForm.watch('requestCustomLayout') && (
            <div className="space-y-2">
              <Label htmlFor="customLayoutNotes">Custom Layout Notes</Label>
              <Input
                id="customLayoutNotes"
                placeholder="Please describe your desired layout"
                className="bg-gray-800 border-gray-700 text-white"
                {...seatLayoutForm.register('customLayoutNotes')}
              />
            </div>
          )}
          
          {/* Seat layout visualization placeholder */}
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
            <div className="flex items-center justify-center h-20">
              <Sofa className="h-6 w-6 text-[#DAFF0D] mr-2" />
              <span className="text-sm text-gray-300">
                {seatLayoutForm.watch('totalSeats') ? 
                  `Aircraft with ${seatLayoutForm.watch('totalSeats')} seats in ${seatLayoutForm.watch('layoutType')} layout` : 
                  'Enter total seats to preview layout'}
              </span>
            </div>
          </div>
        
          {/* Fixed bottom navigation */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" className="bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  // Third step - Interior Details
  const renderInteriorDetailsStep = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-900 rounded-lg p-5 mb-5">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Settings className="mr-2 h-5 w-5 text-[#DAFF0D]" />
          Interior Details
        </h2>
        
        <form onSubmit={interiorDetailsForm.handleSubmit(handleInteriorDetailsSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interiorType">Interior Type</Label>
            <Select 
              defaultValue="Standard" 
              onValueChange={(value) => interiorDetailsForm.setValue('interiorType', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select interior type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {interiorDetailsForm.formState.errors.interiorType && (
              <p className="text-[#FF4B47] text-sm">{interiorDetailsForm.formState.errors.interiorType.message}</p>
            )}
          </div>
          
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium">Amenities</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="berths" className="text-sm flex items-center">
                <span>Sleeping Berths</span>
              </Label>
              <Switch 
                id="berths" 
                onCheckedChange={(checked) => interiorDetailsForm.setValue('berths', checked)}
                className="bg-gray-600 data-[state=checked]:bg-[#DAFF0D]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="lavatory" className="text-sm flex items-center">
                <span>Lavatory</span>
              </Label>
              <Switch 
                id="lavatory" 
                onCheckedChange={(checked) => interiorDetailsForm.setValue('lavatory', checked)}
                className="bg-gray-600 data-[state=checked]:bg-[#DAFF0D]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="galley" className="text-sm flex items-center">
                <span>Galley/Kitchen</span>
              </Label>
              <Switch 
                id="galley" 
                onCheckedChange={(checked) => interiorDetailsForm.setValue('galley', checked)}
                className="bg-gray-600 data-[state=checked]:bg-[#DAFF0D]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="wifi" className="text-sm flex items-center">
                <span>Wi-Fi Connectivity</span>
              </Label>
              <Switch 
                id="wifi" 
                onCheckedChange={(checked) => interiorDetailsForm.setValue('wifi', checked)}
                className="bg-gray-600 data-[state=checked]:bg-[#DAFF0D]"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entertainment">Entertainment Options</Label>
            <Input
              id="entertainment"
              placeholder="e.g., Satellite TV, Music System"
              className="bg-gray-800 border-gray-700 text-white"
              {...interiorDetailsForm.register('entertainment')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Input
              id="notes"
              placeholder="Any other details about the interior"
              className="bg-gray-800 border-gray-700 text-white"
              {...interiorDetailsForm.register('notes')}
            />
          </div>
        
          {/* Fixed bottom navigation */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" className="bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  // Fourth step - Home Base
  const renderHomeBaseStep = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-900 rounded-lg p-5 mb-5">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Home className="mr-2 h-5 w-5 text-[#DAFF0D]" />
          Home Base
        </h2>
        
        <form onSubmit={homeBaseForm.handleSubmit(handleHomeBaseSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="homeBaseAirport">Home Base Airport</Label>
            <Input
              id="homeBaseAirport"
              placeholder="e.g., KJFK, KDAL"
              className="bg-gray-800 border-gray-700 text-white"
              {...homeBaseForm.register('homeBaseAirport')}
            />
            {homeBaseForm.formState.errors.homeBaseAirport && (
              <p className="text-[#FF4B47] text-sm">{homeBaseForm.formState.errors.homeBaseAirport.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Current Status</Label>
            <Select 
              defaultValue="available" 
              onValueChange={(value) => homeBaseForm.setValue('status', value as "available" | "maintenance" | "reserved")}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">In Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Operation Rate (Optional)</Label>
            <Input
              id="hourlyRate"
              placeholder="e.g., 5000"
              type="number"
              className="bg-gray-800 border-gray-700 text-white"
              {...homeBaseForm.register('hourlyRate')}
            />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 mt-6">
            <h3 className="text-white text-sm font-medium mb-3">Jet Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Aircraft</span>
                <span className="text-white">{jetDetailsForm.getValues().manufacturer} {jetDetailsForm.getValues().model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seats</span>
                <span className="text-white">{seatLayoutForm.getValues().totalSeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Year</span>
                <span className="text-white">{jetDetailsForm.getValues().year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Home Base</span>
                <span className="text-white">{homeBaseForm.getValues().homeBaseAirport}</span>
              </div>
            </div>
          </div>
        
          {/* Add offline indicator if data was saved offline */}
          {isOfflineSaved && (
            <div className="bg-amber-900/50 rounded-lg p-3 mt-4 mb-2 text-amber-200 text-sm flex items-center">
              <div className="mr-2 rounded-full w-2 h-2 bg-amber-400 animate-pulse"></div>
              Form data saved locally. You can continue editing or try submitting again later.
            </div>
          )}
        
          {/* Fixed bottom navigation */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800 flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              type="submit" 
              className="bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-black min-h-screen text-white pb-20">
      {/* Mobile-optimized header with back button */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-gray-800 p-4">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/gdyup/jets')} 
            className="flex items-center text-[#DAFF0D]"
          >
            <ChevronLeft className="h-6 w-6 mr-1" />
            <span>Back to My Jets</span>
          </button>
        </div>
      </div>
      
      {/* Content container with padding for fixed header and bottom nav */}
      <div className="container mx-auto px-4 pt-20">
        <h1 className="text-2xl font-bold mb-2 text-[#DAFF0D]">Add New Jet</h1>
        
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#DAFF0D] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span className={step >= 1 ? "text-[#DAFF0D]" : ""}>Details</span>
            <span className={step >= 2 ? "text-[#DAFF0D]" : ""}>Layout</span>
            <span className={step >= 3 ? "text-[#DAFF0D]" : ""}>Interior</span>
            <span className={step >= 4 ? "text-[#DAFF0D]" : ""}>Location</span>
          </div>
        </div>
        
        {/* Form steps */}
        <AnimatePresence mode="wait">
          {step === 1 && renderJetDetailsStep()}
          {step === 2 && renderSeatLayoutStep()}
          {step === 3 && renderInteriorDetailsStep()}
          {step === 4 && renderHomeBaseStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}