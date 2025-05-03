'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plane, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import Image from 'next/image';

// Define form schema
const formSchema = z.object({
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().min(1, 'Year is required'),
  tail_number: z.string().min(1, 'Tail number is required'),
  capacity: z.string().min(1, 'Seating capacity is required'),
  home_base_airport: z.string().min(1, 'Home base is required'),
  range_nm: z.string().optional(),
  cruise_speed_kts: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewJetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get manufacturer and model from URL if available
  const manufacturerParam = searchParams?.get('manufacturer');
  const modelParam = searchParams?.get('model');
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      manufacturer: manufacturerParam || '',
      model: modelParam || '',
      year: new Date().getFullYear().toString(),
      tail_number: '',
      capacity: '',
      home_base_airport: '',
      range_nm: '',
      cruise_speed_kts: '',
      notes: '',
      category: '',
    },
  });
  
  // Function to handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to add a jet');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, send data to the API
      // const response = await fetch('/api/jets', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...values,
      //     user_id: user.id,
      //   }),
      // });
      
      // Instead, simulate an API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Jet added successfully!');
      
      // Navigate back to jets page
      router.push('/gdyup/jets');
    } catch (err) {
      console.error('Error adding jet:', err);
      toast.error('Failed to add jet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Set a placeholder image path
  const jetImagePath = `/images/jets/default-jet.jpg`;
  
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/gdyup/jets/models')}
            className="mr-2 p-0 h-10 w-10 rounded-full bg-black/30"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Add New Jet</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jet Image Card */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden h-fit">
          <div className="relative h-48 w-full bg-gray-800">
            <Image
              src={jetImagePath}
              alt="Jet Preview"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <CardHeader className="p-4">
            <CardTitle className="text-white text-lg">
              {form.watch('manufacturer')} {form.watch('model')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-gray-400 text-sm">
              Add your jet details to make it available for jet shares and track usage.
            </p>
          </CardContent>
        </Card>
        
        {/* Form Card */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-white">Jet Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Basic Jet Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Manufacturer</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Gulfstream" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Model</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., G650" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Year</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 2023" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tail_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Tail Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., N12345" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Seating Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 14" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="home_base_airport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Home Base Airport</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., KJFK" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="range_nm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Range (nm)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 7000" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cruise_speed_kts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Cruise Speed (kts)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 500" 
                            className="bg-gray-800 border-gray-700 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="Light Jet">Light Jet</SelectItem>
                            <SelectItem value="Midsize Jet">Midsize Jet</SelectItem>
                            <SelectItem value="Super-Midsize Jet">Super-Midsize Jet</SelectItem>
                            <SelectItem value="Large Jet">Large Jet</SelectItem>
                            <SelectItem value="Heavy Jet">Heavy Jet</SelectItem>
                            <SelectItem value="Ultra Long Range">Ultra Long Range</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional details about your jet" 
                          className="bg-gray-800 border-gray-700 text-white min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-[#DAFF0D] hover:bg-[#E8FF4D] text-black"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Jet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 