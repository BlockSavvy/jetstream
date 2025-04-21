'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { validateJetData, prepareJetDataForSubmission, logFormDebugInfo } from '@/app/gdyup/lib/jet-utils'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().optional(),
  affiliation: z.string().optional(),
  bio: z.string().optional(),
  ownsJet: z.enum(['yes', 'no']),
})

// Extended schema for jet owners
const jetSchema = z.object({
  tailNumber: z.string().min(1, 'Tail number is required'),
  model: z.string().min(1, 'Aircraft model is required'),
  capacity: z.string().min(1, 'Capacity is required'),
  operator: z.string().optional(),
  baseAirport: z.string().optional(),
})

// Combine schemas based on user selection
const combinedSchema = z.discriminatedUnion('ownsJet', [
  z.object({
    ownsJet: z.literal('yes'),
    firstName: profileSchema.shape.firstName,
    lastName: profileSchema.shape.lastName,
    role: profileSchema.shape.role,
    affiliation: profileSchema.shape.affiliation,
    bio: profileSchema.shape.bio,
    tailNumber: jetSchema.shape.tailNumber,
    model: jetSchema.shape.model,
    capacity: jetSchema.shape.capacity,
    operator: jetSchema.shape.operator,
    baseAirport: jetSchema.shape.baseAirport,
  }),
  z.object({
    ownsJet: z.literal('no'),
    firstName: profileSchema.shape.firstName,
    lastName: profileSchema.shape.lastName,
    role: profileSchema.shape.role,
    affiliation: profileSchema.shape.affiliation,
    bio: profileSchema.shape.bio,
  }),
])

type ProfileFormValues = z.infer<typeof combinedSchema>

interface ProfileSetupFormProps {
  email: string
}

export function ProfileSetupForm({ email }: ProfileSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'profile' | 'jet' | 'complete'>('profile')
  const router = useRouter()
  const { user, refreshSession } = useAuth()
  const searchParams = useSearchParams()
  
  // Check if a specific step is requested (e.g., from middleware redirect)
  useEffect(() => {
    const paramStep = searchParams?.get('step')
    if (paramStep === 'jet') {
      setStep('jet')
    }
  }, [searchParams])
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: '',
      affiliation: '',
      bio: '',
      ownsJet: 'no',
    } as ProfileFormValues,
  })
  
  // Effect to set default values for jet fields when ownsJet changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'ownsJet' && value.ownsJet === 'yes') {
        // When user selects they own a jet, initialize the jet fields with empty values
        form.setValue('tailNumber', '', { shouldValidate: false });
        form.setValue('model', '', { shouldValidate: false });
        form.setValue('capacity', '', { shouldValidate: false });
        console.log('Initialized jet fields with default values');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Fetch existing profile data if user is logged in
  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/gdyup/profile?userId=${user.id}`)
        
        if (response.ok) {
          const { data } = await response.json()
          
          // Pre-fill form data
          form.setValue('firstName', data.first_name || '')
          form.setValue('lastName', data.last_name || '')
          form.setValue('role', data.role || '')
          form.setValue('affiliation', data.affiliation || '')
          form.setValue('bio', data.bio || '')
          
          // Check if user has jets to determine jet ownership
          if (data.has_jet || (data.jets && data.jets.length > 0)) {
            form.setValue('ownsJet', 'yes')
            
            // If we're on the jet step and user has jets, pre-fill jet form
            if (step === 'jet' && data.jets && data.jets.length > 0) {
              const jet = data.jets[0]
              form.setValue('tailNumber', jet.tail_number || '')
              form.setValue('model', jet.model || '')
              form.setValue('capacity', String(jet.capacity) || '')
              form.setValue('operator', jet.operator || '')
              form.setValue('baseAirport', jet.base_airport || '')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfileData()
  }, [user, form, step])
  
  // Handle form submission for profile step
  async function onProfileSubmit(data: Partial<ProfileFormValues>) {
    setIsLoading(true)
    
    try {
      // Construct the profile data
      const profileData = {
        email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role || null,
        affiliation: data.affiliation || null,
        bio: data.bio || null,
        onboarding_completed: data.ownsJet === 'no', // Mark as completed if they don't own a jet
        onboarding_step: data.ownsJet === 'yes' ? 'jet' : 'completed',
        has_jet: data.ownsJet === 'yes', // Add this to indicate user has jet
      }
      
      if (user) {
        // User is logged in - update via API
        const response = await fetch('/api/gdyup/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id,
            profileData 
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save profile')
        }
      } else {
        // User is not logged in yet - store in session for later
        sessionStorage.setItem('gdyup_profile_data', JSON.stringify(profileData))
      }
      
      toast.success('Profile information saved')
      
      // If user owns a jet, proceed to jet info form
      if (data.ownsJet === 'yes') {
        setStep('jet')
      } else {
        // Otherwise, mark as completed and redirect to dashboard
        setStep('complete')
        setTimeout(() => {
          router.push('/gdyup/dashboard')
        }, 1500)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile information')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle form submission for jet step
  async function onJetSubmit(data: ProfileFormValues) {
    if (data.ownsJet !== 'yes') return
    
    // Log form debug info
    logFormDebugInfo(form);
    
    setIsLoading(true)
    console.log('Submitting jet information:', data);
    
    try {
      // Prepare jet data
      const jetData = prepareJetDataForSubmission(data);
      
      // Validate jet data before submission
      const { isValid, errors } = validateJetData(jetData);
      
      if (!isValid) {
        console.error('Jet data validation failed:', errors);
        Object.entries(errors).forEach(([field, message]) => {
          toast.error(`${message}`);
        });
        setIsLoading(false);
        return;
      }
      
      console.log('Prepared jet data:', jetData);
      
      if (user) {
        console.log('User is logged in, submitting to API');
        // If user is logged in, save jet to database via API
        const response = await fetch('/api/gdyup/jets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id,
            jet: jetData 
          })
        })
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('API error response:', errorData);
          throw new Error(errorData.error || 'Failed to save jet information')
        }
        
        // Update profile to mark onboarding complete
        await fetch('/api/gdyup/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id,
            profileData: {
              onboarding_completed: true,
              onboarding_step: 'completed'
            }
          })
        });
      } else {
        console.log('User not logged in, storing in session storage');
        // If not logged in, store jet data in session storage
        sessionStorage.setItem('gdyup_jet_data', JSON.stringify(jetData))
      }
      
      toast.success('Jet information saved')
      setStep('complete')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/gdyup/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error saving jet information:', error)
      toast.error('Failed to save jet information')
    } finally {
      setIsLoading(false)
    }
  }
  
  function renderProgressIndicator() {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'profile' ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
          }`}>
            1
          </div>
          <div className="w-12 h-1 bg-gray-200">
            <div className={`h-full ${step !== 'profile' ? 'bg-primary' : 'bg-gray-200'}`}></div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'jet' ? 'bg-primary text-white' : step === 'complete' ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>
      </div>
    )
  }
  
  // Render the appropriate form step
  if (step === 'profile') {
    return (
      <div className="w-full space-y-6">
        {renderProgressIndicator()}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">First Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="John" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Last Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Pilot, Executive, etc." className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Your role in the aviation industry (optional)
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="affiliation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Affiliation</FormLabel>
                  <FormControl>
                    <Input placeholder="Company or organization" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Your company or organization (optional)
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us a bit about yourself" 
                      className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    A brief description about yourself (optional)
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ownsJet"
              render={({ field }) => (
                <FormItem className="mt-6 space-y-3">
                  <FormLabel className="text-gray-200">Do you own or operate a private jet?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal text-gray-200">
                          Yes, I own or operate a private jet
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal text-gray-200">
                          No, I don't own or operate a private jet
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </Form>
      </div>
    )
  }
  
  if (step === 'jet') {
    return (
      <div className="w-full space-y-6">
        {renderProgressIndicator()}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onJetSubmit, (errors) => {
            console.error('Jet form validation errors:', errors);
            toast.error('Please fill in all required fields');
          })} className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4 text-white">Tell us about your aircraft</h2>
            
            <FormField
              control={form.control}
              name="tailNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Tail Number*</FormLabel>
                  <FormControl>
                    <Input placeholder="N123AB" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Aircraft Model*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gulfstream G650" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Passenger Capacity*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 12" 
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" 
                      type="number" 
                      min="1"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Operator</FormLabel>
                  <FormControl>
                    <Input placeholder="Operating company" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    The company that operates this aircraft (optional)
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="baseAirport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Base Airport</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. KTEB" className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" {...field} />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    The primary airport where this aircraft is based (optional)
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-12" 
                onClick={() => setStep('profile')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12" 
                disabled={isLoading}
                onClick={() => {
                  console.log('Submit clicked, form state:', form.formState);
                  console.log('Current form values:', form.getValues());
                  console.log('Form errors:', form.formState.errors);
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }
  
  // Completion screen
  return (
    <div className="w-full text-center space-y-4 py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">Setup Complete!</h2>
      <p className="text-gray-400">
        Your account has been successfully set up. Redirecting you to the dashboard...
      </p>
      <div className="flex justify-center mt-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  )
} 