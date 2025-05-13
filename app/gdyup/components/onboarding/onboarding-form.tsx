'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useGdyupTheme } from '../../hooks/useGdyupTheme'
import { cn } from '@/lib/utils'

const onboardingSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function OnboardingForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const { getThemedTextClasses, getThemedButtonClasses } = useGdyupTheme()

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof onboardingSchema>) {
    setIsLoading(true)
    try {
      console.log('Submitting registration for:', values.email)
      const { error } = await signUp(values.email, values.password)
      if (error) {
        console.error('Registration error:', error.message)
        toast.error(error.message || 'Failed to sign up')
      } else {
        console.log('Registration successful')
        toast.success('Account created successfully!')
        
        // Store email in session storage to access it in the next step
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gdyup_onboarding_email', values.email)
        }
        
        // Route to the profile setup page
        router.push('/gdyup/auth/profile-setup')
      }
    } catch (error) {
      console.error('Unexpected registration error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={getThemedTextClasses()}>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="youremail@example.com" 
                    type="email" 
                    className="h-12 bg-gdyup-bg-dark border-gdyup-border text-gdyup-text placeholder:text-gdyup-text-muted" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={getThemedTextClasses()}>Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    className="h-12 bg-gdyup-bg-dark border-gdyup-border text-gdyup-text placeholder:text-gdyup-text-muted" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={getThemedTextClasses()}>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    type="password" 
                    className="h-12 bg-gdyup-bg-dark border-gdyup-border text-gdyup-text placeholder:text-gdyup-text-muted" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className={cn("w-full h-12 mt-6 font-medium", getThemedButtonClasses('primary'))}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm mt-6">
        <span className={getThemedTextClasses('muted')}>Already have an account?</span>{' '}
        <a href="/gdyup/auth/login" className="font-medium text-gdyup-primary hover:text-gdyup-primary/80">
          Sign in
        </a>
      </div>
    </div>
  )
} 