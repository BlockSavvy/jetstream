'use client'

import { useState, useEffect } from 'react'
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
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingPaymentOfferId, setPendingPaymentOfferId] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const errorParam = searchParams.get('error')

  // Check for error parameter in URL and display it
  useEffect(() => {
    if (errorParam) {
      const error = decodeURIComponent(errorParam)
      setErrorMessage(error)
      // Clear error from URL without navigating
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [errorParam])
  
  // Check for pending payment in cookies
  useEffect(() => {
    // Function to check for pending payment in cookies
    const checkPendingPayment = () => {
      try {
        // Check multiple sources for pending payment info
        const hasPendingPayment = document.cookie.includes('jetshare_pending_payment=true');
        const pendingOfferIdCookie = document.cookie.split(';').find(c => c.trim().startsWith('pending_payment_offer_id='));
        const searchParams = new URLSearchParams(window.location.search);
        const returnUrlParam = searchParams.get('returnUrl') || '';
        
        // Check if return URL contains jetshare/payment indicator
        const isPaymentReturn = returnUrlParam.includes('/jetshare/payment/');
        
        // Extract offer ID from various sources
        let pendingOfferId = null;
        
        if (pendingOfferIdCookie) {
          pendingOfferId = pendingOfferIdCookie.split('=')[1];
        } else if (isPaymentReturn) {
          // Extract offer ID from return URL
          const matches = returnUrlParam.match(/\/jetshare\/payment\/([^/?&]+)/);
          if (matches && matches[1]) {
            pendingOfferId = matches[1];
          }
        } else if (localStorage.getItem('current_payment_offer_id')) {
          // Fallback to localStorage
          pendingOfferId = localStorage.getItem('current_payment_offer_id');
        }
        
        if (pendingOfferId) {
          console.log('Found pending payment offer ID:', pendingOfferId);
          setPendingPaymentOfferId(pendingOfferId);
        } else if (hasPendingPayment || isPaymentReturn) {
          // We know there's a pending payment but don't have the ID
          console.log('Pending payment detected but no specific offer ID found');
          setPendingPaymentOfferId('unknown');
        }
      } catch (e) {
        console.warn('Error checking for pending payment:', e);
      }
    };
    
    checkPendingPayment();
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    setErrorMessage(null) // Clear any previous errors
    
    try {
      console.log('Submitting login form with email:', values.email)
      const { error, session } = await signIn(values.email, values.password)
      
      if (error) {
        console.error('Login form error:', error)
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          setErrorMessage('Network error during sign in. Please try again. If the issue persists, check your browser settings or try another browser.')
        } else {
          setErrorMessage(error.message || 'Failed to sign in')
        }
        setIsLoading(false)
        return
      }

      // Authentication successful
      if (session) {
        console.log('Login successful, session established:', !!session)
        
        // Show success message
        toast.success('Signed in successfully!')
        
        // Determine the redirect URL - prioritize pending payment flow if it exists
        let finalRedirectUrl = returnUrl || '/';
        
        // If there's a pending payment, redirect to the payment page
        if (pendingPaymentOfferId) {
          const paymentUrl = `/jetshare/payment/${pendingPaymentOfferId}?t=${Date.now()}&from=login`;
          console.log('Redirecting to pending payment:', paymentUrl);
          finalRedirectUrl = paymentUrl;
        }
        
        // Give the session a moment to fully establish
        setTimeout(() => {
          if (finalRedirectUrl) {
            console.log('Redirecting to:', finalRedirectUrl)
            // Use the router for same-origin URLs, window.location for cross-origin
            if (finalRedirectUrl.startsWith('/')) {
              router.push(finalRedirectUrl)
              router.refresh()
            } else {
              try {
                // Validate that the URL is safe to redirect to
                const url = new URL(finalRedirectUrl)
                if (url.origin === window.location.origin) {
                  router.push(finalRedirectUrl)
                } else {
                  // For external URLs, log a warning and use window.location
                  console.warn('Redirecting to external URL:', finalRedirectUrl)
                  window.location.href = finalRedirectUrl
                }
              } catch (e) {
                console.error('Invalid redirect URL:', e)
                router.push('/')
              }
            }
          } else {
            console.log('Redirecting to home page')
            router.push('/')
            router.refresh()
          }
          // Set loading to false after redirect completes
          setIsLoading(false)
        }, 800) // Slightly longer delay to ensure session is established
      } else {
        console.warn('Login successful but no session returned')
        setErrorMessage('Authentication successful but session not established. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('An unexpected error occurred. Please try again later.')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold dark:text-white">Welcome back</h1>
        <p className="text-muted-foreground dark:text-gray-300">Enter your credentials to sign in</p>
        
        {pendingPaymentOfferId && (
          <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-900/40 dark:border-blue-700">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <div className="font-medium">Complete Your Booking</div>
                <p className="text-sm mt-1 dark:text-blue-300">Please sign in to continue with your flight booking. Your selection is being held for you.</p>
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>
      
      {errorMessage && (
        <Alert variant="destructive" className="mt-4 dark:bg-red-900/40 dark:border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="dark:text-red-200">{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-200">Email</FormLabel>
                <FormControl>
                  <Input placeholder="youremail@example.com" type="email" {...field} 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" />
                </FormControl>
                <FormMessage className="dark:text-red-300" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="dark:text-gray-200">Password</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input placeholder="••••••••" type="password" {...field} 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </FormControl>
                <FormMessage className="dark:text-red-300" />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        <span className="text-muted-foreground dark:text-gray-400">Don't have an account?</span>{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline dark:text-blue-400 dark:hover:text-blue-300">
          Sign up
        </Link>
      </div>
    </div>
  )
} 