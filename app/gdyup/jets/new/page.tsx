'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

// Form schema with validation
const formSchema = z.object({
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number'),
  tail_number: z.string().min(1, 'Tail number is required'),
  capacity: z.string().min(1, 'Capacity is required'),
  home_base_airport: z.string().min(1, 'Home base airport is required'),
  range_nm: z.string().optional(),
  cruise_speed_kts: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Component that uses searchParams
function NewJetContent() {
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Add New Jet</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img 
              src={jetImagePath} 
              alt="Default jet" 
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium mb-2">Why add your jet?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding your jet to GDY·UP allows you to easily create flight share offers
              and manage your aircraft details in one place.
            </p>
            <h3 className="font-medium mb-2">Benefits:</h3>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Easily create flight share offers</li>
              <li>Track flight history</li>
              <li>Manage maintenance records</li>
              <li>Share with trusted co-owners</li>
            </ul>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Gulfstream" {...field} />
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
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. G650" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2022" {...field} />
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
                        <FormLabel>Tail Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. N12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="home_base_airport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Base Airport</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. KTEB (Teterboro)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="range_nm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Range (NM)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7000" {...field} />
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
                        <FormLabel>Cruise Speed (KTS)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional information about your jet"
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Add Jet'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewJetPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <NewJetContent />
    </Suspense>
  );
} 