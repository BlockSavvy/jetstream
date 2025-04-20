'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plane, Home, Sofa, Settings } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import JetSeatVisualizer from '@/app/jetshare/components/JetSeatVisualizer';

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

// Types for form data
interface JetDetailsFormData {
  manufacturer: string;
  model: string;
  year: string;
  tailNumber: string;
  category: "light" | "midsize" | "super_midsize" | "heavy";
  description?: string;
  cruiseSpeedKts?: string;
  rangeNm?: string;
}

interface SeatLayoutFormData {
  layoutType: "standard" | "luxury" | "custom";
  totalSeats: string;
  requestCustomLayout?: boolean;
  customLayoutNotes?: string;
}

interface InteriorDetailsFormData {
  interiorType: string;
  berths?: boolean;
  lavatory?: boolean;
  galley?: boolean;
  entertainment?: string;
  wifi?: boolean;
  notes?: string;
}

interface HomeBaseFormData {
  homeBaseAirport: string;
  status: "available" | "maintenance" | "reserved";
  hourlyRate?: string;
}

// Main component
export default function AddJet() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [jetDetails, setJetDetails] = useState<JetDetailsFormData>({} as JetDetailsFormData);
  const [seatLayout, setSeatLayout] = useState<SeatLayoutFormData>({} as SeatLayoutFormData);
  const [interiorDetails, setInteriorDetails] = useState<InteriorDetailsFormData>({} as InteriorDetailsFormData);
  const [homeBase, setHomeBase] = useState<HomeBaseFormData>({} as HomeBaseFormData);
  const [jetId, setJetId] = useState('temp-id'); // Temporary ID for visualization
  const [modelDataLoaded, setModelDataLoaded] = useState(false);

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

  // Handle submission for each step
  const handleJetDetailsSubmit = (data: JetDetailsFormData) => {
    setJetDetails(data);
    setStep(2);
  };

  const handleSeatLayoutSubmit = (data: SeatLayoutFormData) => {
    setSeatLayout(data);
    setStep(3);
  };

  const handleInteriorDetailsSubmit = (data: InteriorDetailsFormData) => {
    setInteriorDetails(data);
    setStep(4);
  };

  const handleHomeBaseSubmit = async (data: HomeBaseFormData) => {
    setHomeBase(data);
    setLoading(true);
    
    try {
      // Combine all form data
      const jetData = {
        ...jetDetails,
        ...seatLayout,
        ...interiorDetails,
        ...data,
      };
      
      // Submit to API
      const response = await fetch('/api/jets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jetData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add jet');
      }
      
      const result = await response.json();
      toast.success('Jet added successfully!');
      router.push(`/jets/${result.id}`);
    } catch (error) {
      console.error('Error adding jet:', error);
      toast.error('Failed to add jet. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigation between steps
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Calculate progress percentage
  const progress = (step / 4) * 100;
  
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#D8D8D8]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-[#39FF14]" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="container max-w-md mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Add Your Jet</h1>
        <p className="text-gray-400 mb-6">Step {step} of 4</p>
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4 mb-6">
                <Plane className="h-12 w-12 text-[#39FF14]" />
              </div>
              
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
                    <p className="text-[#DC143C] text-sm">{jetDetailsForm.formState.errors.manufacturer.message}</p>
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
                    <p className="text-[#DC143C] text-sm">{jetDetailsForm.formState.errors.model.message}</p>
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
                      <p className="text-[#DC143C] text-sm">{jetDetailsForm.formState.errors.year.message}</p>
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
                      <p className="text-[#DC143C] text-sm">{jetDetailsForm.formState.errors.tailNumber.message}</p>
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
                
                <Button type="submit" className="w-full bg-[#39FF14] hover:bg-[#32E012] text-black font-medium">
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4 mb-6">
                <Sofa className="h-12 w-12 text-[#39FF14]" />
              </div>
              
              <h2 className="text-xl font-semibold text-white">Seating Layout</h2>
              <p className="text-gray-400">Configure how passengers will be seated</p>
              
              <form onSubmit={seatLayoutForm.handleSubmit(handleSeatLayoutSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSeats">Total Number of Seats</Label>
                  <Input
                    id="totalSeats"
                    placeholder="e.g., 10"
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    {...seatLayoutForm.register('totalSeats')}
                    onChange={(e) => {
                      seatLayoutForm.setValue('totalSeats', e.target.value);
                      // Trigger re-render of seat visualizer
                    }}
                  />
                  {seatLayoutForm.formState.errors.totalSeats && (
                    <p className="text-[#DC143C] text-sm">{seatLayoutForm.formState.errors.totalSeats.message}</p>
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
                
                {/* Seat Visualizer */}
                <div className="my-6 bg-gray-900 p-4 rounded-lg">
                  <h3 className="text-white text-sm font-medium mb-3">Seat Layout Preview</h3>
                  <div className="h-60 flex items-center justify-center">
                    {seatLayoutForm.watch('totalSeats') ? (
                      <JetSeatVisualizer 
                        jet_id={jetId}
                        totalSeats={parseInt(seatLayoutForm.watch('totalSeats') || "0")}
                        readOnly={true}
                        showControls={false}
                        showLegend={false}
                      />
                    ) : (
                      <p className="text-gray-400 text-sm">Enter total seats to preview layout</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="requestCustomLayout" 
                    onCheckedChange={(checked) => 
                      seatLayoutForm.setValue('requestCustomLayout', checked === true)
                    }
                  />
                  <Label htmlFor="requestCustomLayout" className="text-sm">
                    Request custom layout from administrator
                  </Label>
                </div>
                
                {seatLayoutForm.watch('requestCustomLayout') && (
                  <div className="space-y-2">
                    <Label htmlFor="customLayoutNotes">Custom Layout Notes</Label>
                    <Input
                      id="customLayoutNotes"
                      placeholder="Describe your custom layout needs"
                      className="bg-gray-800 border-gray-700 text-white"
                      {...seatLayoutForm.register('customLayoutNotes')}
                    />
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#39FF14] hover:bg-[#32E012] text-black font-medium"
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4 mb-6">
                <Settings className="h-12 w-12 text-[#39FF14]" />
              </div>
              
              <h2 className="text-xl font-semibold text-white">Interior Details</h2>
              <p className="text-gray-400">Configure the interior features of your jet</p>
              
              <form onSubmit={interiorDetailsForm.handleSubmit(handleInteriorDetailsSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="interiorType">Interior Type</Label>
                  <Input
                    id="interiorType"
                    placeholder="e.g., Luxury VIP, Standard Executive"
                    className="bg-gray-800 border-gray-700 text-white"
                    {...interiorDetailsForm.register('interiorType')}
                  />
                  {interiorDetailsForm.formState.errors.interiorType && (
                    <p className="text-[#DC143C] text-sm">{interiorDetailsForm.formState.errors.interiorType.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="berths" 
                      onCheckedChange={(checked) => 
                        interiorDetailsForm.setValue('berths', checked)
                      }
                    />
                    <Label htmlFor="berths">Berths/Beds</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="lavatory" 
                      onCheckedChange={(checked) => 
                        interiorDetailsForm.setValue('lavatory', checked)
                      }
                    />
                    <Label htmlFor="lavatory">Lavatory</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="galley" 
                      onCheckedChange={(checked) => 
                        interiorDetailsForm.setValue('galley', checked)
                      }
                    />
                    <Label htmlFor="galley">Galley</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="wifi" 
                      onCheckedChange={(checked) => 
                        interiorDetailsForm.setValue('wifi', checked)
                      }
                    />
                    <Label htmlFor="wifi">WiFi</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entertainment">Entertainment System</Label>
                  <Input
                    id="entertainment"
                    placeholder="e.g., Premium entertainment with multiple screens"
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
                
                <div className="flex space-x-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#39FF14] hover:bg-[#32E012] text-black font-medium"
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
          
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4 mb-6">
                <Home className="h-12 w-12 text-[#39FF14]" />
              </div>
              
              <h2 className="text-xl font-semibold text-white">Base & Availability</h2>
              <p className="text-gray-400">Set home base and availability details</p>
              
              <form onSubmit={homeBaseForm.handleSubmit(handleHomeBaseSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="homeBaseAirport">Home Base Airport</Label>
                  <Input
                    id="homeBaseAirport"
                    placeholder="e.g., KLAX, KJFK, KSFO"
                    className="bg-gray-800 border-gray-700 text-white"
                    {...homeBaseForm.register('homeBaseAirport')}
                  />
                  {homeBaseForm.formState.errors.homeBaseAirport && (
                    <p className="text-[#DC143C] text-sm">{homeBaseForm.formState.errors.homeBaseAirport.message}</p>
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
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourlyRate"
                    placeholder="e.g., 5000"
                    type="number"
                    className="bg-gray-800 border-gray-700 text-white"
                    {...homeBaseForm.register('hourlyRate')}
                  />
                </div>
                
                {/* Summary of all information */}
                <div className="bg-gray-900 rounded-lg p-4 mt-6">
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
                
                <div className="flex space-x-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#39FF14] hover:bg-[#32E012] text-black font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Submit <Check className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 