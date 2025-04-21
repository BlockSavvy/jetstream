'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingMiddlewareProps {
  children: React.ReactNode
}

interface Profile {
  id: string;
  onboarding_completed?: boolean;
  onboarding_step?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export function OnboardingMiddleware({ children }: OnboardingMiddlewareProps) {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Auth paths that should be excluded from the check
  const excludePaths = [
    '/gdyup/auth/login',
    '/gdyup/auth/signup',
    '/gdyup/auth/forgot-password',
    '/gdyup/auth/reset-password',
    '/gdyup/auth/profile-setup'
  ]
  
  // Check if the current path is excluded
  const isExcludedPath = excludePaths.some(path => pathname?.startsWith(path))
  
  useEffect(() => {
    // Skip this check for excluded paths or when auth is still loading
    if (isExcludedPath || authLoading) {
      setLoading(false)
      return
    }
    
    async function checkOnboardingStatus() {
      try {
        // If user is not logged in, allow access to public pages
        if (!user) {
          setLoading(false)
          
          // If trying to access a protected route, redirect to login
          if (pathname && !pathname.startsWith('/gdyup/auth/') && pathname !== '/gdyup') {
            router.push('/gdyup/auth/login')
          }
          return
        }
        
        // User is logged in, check if they've completed onboarding
        const supabase = getSupabaseClient()
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_step, first_name, last_name, email')
          .eq('id', user.id)
          .single()
        
        // Handle case where profile doesn't exist for the user
        if (error && error.code === 'PGRST116') { // No rows returned
          console.log('No profile found for user, creating one...');
          
          // Create a default profile for the user
          const newProfile: Profile = {
            id: user.id,
            onboarding_completed: false,
            onboarding_step: 'profile',
            email: user.email
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast.error('Failed to create your profile. Please try again.');
            setLoading(false);
            return;
          }
          
          // Redirect to profile setup
          toast.info('Please complete your profile to continue');
          router.push('/gdyup/auth/profile-setup');
          setLoading(false);
          return;
        } else if (error) {
          // Handle other database errors
          console.error('Error checking onboarding status:', error);
          toast.error('There was an error accessing your profile. Please try again later.');
          setLoading(false);
          return;
        }
        
        // If onboarding is not completed and trying to access a page that's not part of onboarding
        if (profile && profile.onboarding_completed === false && 
            !pathname?.startsWith('/gdyup/auth/profile-setup')) {
          
          // Redirect to the appropriate onboarding step
          if (profile.onboarding_step === 'jet') {
            toast.info('Please complete your jet information to continue');
            router.push('/gdyup/auth/profile-setup?step=jet');
          } else {
            toast.info('Please complete your profile to continue');
            router.push('/gdyup/auth/profile-setup');
          }
        }
        
        setLoading(false);
      } catch (error) {
        // Improved error handling with more details
        console.error('Error in onboarding middleware:', error);
        toast.error('There was an error checking your profile status');
        setLoading(false);
      }
    }
    
    checkOnboardingStatus();
  }, [user, authLoading, pathname, router, isExcludedPath]);
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
} 