'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Extract the core login form functionality to a separate component
function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getThemedTextClasses, getThemedButtonClasses } = useGdyupTheme()
  
  // Get return URL from query parameter (if provided)
  const returnUrl = searchParams?.get('returnUrl') || '/gdyup/dashboard'

  // Check if the user was redirected due to an incomplete onboarding
  const needsOnboarding = searchParams?.get('needsOnboarding') === 'true'

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    try {
      console.log('Attempting to sign in:', values.email)
      const { error, session } = await signIn(values.email, values.password)
      
      if (error) {
        console.error('Login error:', error.message)
        toast.error(error.message || 'Failed to sign in')
      } else {
        console.log('Login successful')
        toast.success('Signed in successfully!')
        
        // Use window.location.href for direct navigation instead of router.push for better iOS compatibility
        if (needsOnboarding) {
          window.location.href = '/gdyup/auth/profile-setup';
        } else {
          window.location.href = returnUrl;
        }
      }
    } catch (error) {
      console.error('Unexpected login error:', error)
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
          
          <div className="text-right">
            <a 
              href="/gdyup/auth/forgot-password" 
              className="text-sm font-medium text-gdyup-primary hover:text-gdyup-primary/80"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/gdyup/auth/forgot-password';
              }}
            >
              Forgot Password?
            </a>
          </div>
          
          <Button 
            type="submit" 
            className={cn("w-full h-12 mt-4 font-medium", getThemedButtonClasses('primary'))}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm mt-6">
        <span className={getThemedTextClasses('muted')}>Don't have an account?</span>{' '}
        <a 
          href="/gdyup/auth/signup" 
          className="font-medium text-gdyup-primary hover:text-gdyup-primary/80"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/gdyup/auth/signup';
          }}
        >
          Sign up
        </a>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="w-full flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gdyup-primary" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
} 