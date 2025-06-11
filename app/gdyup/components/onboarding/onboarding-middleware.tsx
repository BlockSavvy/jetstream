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
        
        // First attempt to get a complete profile with all fields
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        // Handle case where profile doesn't exist for the user
        if (error && error.code === 'PGRST116') { // No rows returned
          console.log('No profile found for user, creating one...');
          
          // Extract name from email if available
          let firstName = 'User';  // Default value
          let lastName = '';
          
          if (user.email) {
            const emailName = user.email.split('@')[0];
            // Try to split on common separators
            const nameParts = emailName.split(/[._-]/);
            if (nameParts.length > 1) {
              firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
              lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
            } else {
              // Just use the email name as first name
              firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
          }
          
          // Ensure first_name is never null
          if (!firstName || firstName.trim() === '') {
            firstName = 'User';
          }
          
          // Ensure last_name is never null
          if (!lastName || lastName.trim() === '') {
            lastName = user.email ? user.email.split('@')[0] : 'Profile';
          }
          
          // Create a default profile for the user with all required fields
          const newProfile: Profile = {
            id: user.id,
            onboarding_completed: false,
            onboarding_step: 'profile',
            first_name: firstName,
            last_name: lastName,
            email: user.email
          };
          
          console.log('Creating new profile with data:', newProfile);
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              ...newProfile,
              user_type: 'traveler', 
              verification_status: 'pending',
              profile_visibility: 'public',
              has_jet: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
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
        
        console.log('Profile found:', profile);
        
        // Check if the profile has first_name and last_name set (not null or empty)
        const isProfileComplete = 
          profile.first_name && 
          profile.first_name.trim() !== '' && 
          profile.last_name && 
          profile.last_name.trim() !== '';
          
        // If profile exists but is incomplete, redirect to profile setup
        if (!isProfileComplete && !pathname?.startsWith('/gdyup/auth/profile-setup')) {
          console.log('Profile exists but is incomplete, redirecting to profile setup');
          toast.info('Please complete your profile to continue');
          router.push('/gdyup/auth/profile-setup');
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