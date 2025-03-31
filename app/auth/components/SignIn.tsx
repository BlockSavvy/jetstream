import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Form validation schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get return URL from search params
  const returnUrl = searchParams.get('returnUrl') || '/jetshare';
  const tokenExpired = searchParams.get('tokenExpired') === 'true';

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('Attempting sign in with email:', values.email);
      const { error, session } = await signIn(values.email, values.password);
      
      if (error) {
        console.error('Sign in error:', error.message);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      if (session) {
        console.log('Sign in successful, performing post-login session synchronization');
        
        // Store auth in localStorage for redundancy
        try {
          localStorage.setItem('auth_last_authenticated', 'true');
          localStorage.setItem('jetstream_auth_email', values.email);
          localStorage.setItem('jetstream_session_time', new Date().getTime().toString());
          
          // Store user ID for API fallbacks
          if (session.user?.id) {
            localStorage.setItem('jetstream_user_id', session.user.id);
          }
        } catch (storageError) {
          console.warn('Could not access localStorage:', storageError);
        }
        
        // Ensure token is fresh with explicit refresh and synchronization step
        try {
          console.log('Performing post-login token synchronization');
          const supabase = createClient();
          
          // First try an explicit refresh
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn('Additional token refresh failed, but continuing with redirect:', refreshError);
          } else {
            console.log('Post-login token refresh successful');
            
            // Ensure localStorage token is current by getting and storing the session
            const { data: currentSession } = await supabase.auth.getSession();
            if (currentSession?.session?.access_token) {
              console.log('Updated token in localStorage after refresh');
            }
          }
        } catch (refreshError) {
          console.warn('Error during post-login token synchronization:', refreshError);
        }
        
        // Check for session storage markers from interrupted flows
        let finalReturnPath = returnUrl;
        let resumeOperation = false;
        
        try {
          // Check if we need to resume a payment or offer acceptance
          const pendingOffer = sessionStorage.getItem('jetshare_pending_offer');
          const pendingPayment = sessionStorage.getItem('pending_payment_id');
          const resumeAcceptance = sessionStorage.getItem('jetshare_resume_offer_acceptance');
          
          // Resume payment flow if that's what was interrupted
          if (pendingPayment) {
            console.log('Resuming interrupted payment flow for offer:', pendingPayment);
            finalReturnPath = `/jetshare/payment/${pendingPayment}?t=${Date.now()}&restored=true`;
            sessionStorage.removeItem('pending_payment_id');
            resumeOperation = true;
          } 
          // Otherwise resume offer acceptance if that was interrupted
          else if (resumeAcceptance) {
            console.log('Resuming interrupted offer acceptance:', resumeAcceptance);
            finalReturnPath = `/jetshare/listings?resumeOffer=${resumeAcceptance}&t=${Date.now()}`;
            // We'll handle the actual resumption in the listings page
            resumeOperation = true;
          }
          // Or just return to the pending offer listings if there was a pending offer
          else if (pendingOffer) {
            console.log('Returning to listings with pending offer:', pendingOffer);
            finalReturnPath = `/jetshare/listings?pendingOffer=${pendingOffer}&t=${Date.now()}`;
          }
        } catch (storageError) {
          console.warn('Could not access sessionStorage:', storageError);
        }
        
        toast.success('Signed in successfully!');
        
        // Add a small delay to ensure cookies and tokens are properly synchronized
        setTimeout(() => {
          console.log('Redirecting to:', finalReturnPath);
          window.location.href = finalReturnPath; // Use window.location instead of router for clean state
        }, resumeOperation ? 1500 : 750);
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to log in to your account
        </CardDescription>
        {tokenExpired && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md text-sm">
            Your session has expired. Please sign in again to continue.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-center text-muted-foreground">
          <Link 
            href="/auth/forgot-password" 
            className="text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="text-sm text-center text-muted-foreground">
          Don't have an account?{' '}
          <Link 
            href={`/auth/signup${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} 
            className="text-primary hover:underline"
          >
            Create one
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
} 