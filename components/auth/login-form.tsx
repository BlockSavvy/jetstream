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
        
        // Give the session a moment to fully establish
        setTimeout(() => {
          if (returnUrl) {
            console.log('Redirecting to:', returnUrl)
            // Use the router for same-origin URLs, window.location for cross-origin
            if (returnUrl.startsWith('/')) {
              router.push(returnUrl)
              router.refresh()
            } else {
              try {
                // Validate that the URL is safe to redirect to
                const url = new URL(returnUrl)
                if (url.origin === window.location.origin) {
                  router.push(returnUrl)
                } else {
                  // For external URLs, log a warning and use window.location
                  console.warn('Redirecting to external URL:', returnUrl)
                  window.location.href = returnUrl
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
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Enter your credentials to sign in</p>
      </div>
      
      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="youremail@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input placeholder="••••••••" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
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
        <span className="text-muted-foreground">Don't have an account?</span>{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
} 