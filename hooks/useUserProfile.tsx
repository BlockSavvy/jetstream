"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { toast } from 'sonner';
import { NostrProfile, NostrFeatureFlags } from "@/types/nostr";

export type UserTravelPreferences = {
  id?: string;
  user_id: string;
  travel_interests: string[];
  social_preferences: string[];
  preferred_destinations: string[];
  urgency_preferences: string[];
  crew_specializations?: string[];
  captain_specializations?: string[];
  professional_preference?: string;
  prefer_dedicated_captain?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  company?: string | null;
  position?: string | null;
  website?: string | null;
  location?: string | null;
  verification_status?: string;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
  onboarding_completed?: boolean;
  travel_preferences?: UserTravelPreferences;
  phone_number?: string | null;
  marketing_emails?: boolean;
  profile_visibility?: 'public' | 'private' | 'connections_only';
  social_links?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    [key: string]: string | undefined;
  } | null;
  pilot_license?: string;
  verified?: boolean;
  notification_preferences?: {
    email_marketing?: boolean;
    sms_alerts?: boolean;
    offer_notifications?: boolean;
    travel_updates?: boolean;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    settings?: Record<string, {
      email: boolean;
      push: boolean;
      sms: boolean;
    }>;
  };
  privacy_settings?: {
    profile_visibility?: 'public' | 'connections' | 'private';
    travel_history_visibility?: 'public' | 'connections' | 'private';
    connections_visibility?: 'public' | 'connections' | 'private';
    allow_matching_suggestions?: boolean;
    allow_profile_indexing?: boolean;
    visibility_mode?: string;
    show_profile?: boolean;
    show_travel_history?: boolean;
    show_upcoming_flights?: boolean;
    show_company?: boolean;
    show_social_links?: boolean;
  };
  // Nostr-related fields
  npub?: string | null;
  nip05?: string | null;
  nip05_verified?: boolean;
  lud16?: string | null;
  nostr_pubkey?: string | null;
  nostr_relays?: string[];
  nostr_settings?: {
    enabled: boolean;
    broadcast_offers: boolean;
    receive_messages: boolean;
    enable_zaps: boolean;
    private_mode: boolean;
    auto_connect: boolean;
  };
  nostr_signature?: string | null;
  feature_flags?: NostrFeatureFlags & {
    [key: string]: boolean;
  };
  // Bitcoin wallet fields
  btcWalletAddress?: string | null;
  lnurl?: string | null;
  lightningWalletType?: 'custodial' | 'non-custodial';
  theme?: string | null;
  role?: string | null;
  affiliation?: string | null;
};

/**
 * Hook for managing user profile data
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent excessive profile fetching
  const profileFetchAttempted = useRef(false);
  const isFetchingProfile = useRef(false);
  const fetchAttempts = useRef(0);
  const MAX_FETCH_ATTEMPTS = 3;
  
  /**
   * Fetch user profile from Supabase
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    // If already fetching or too many attempts, skip
    if (isFetchingProfile.current || !userId || fetchAttempts.current >= MAX_FETCH_ATTEMPTS) {
      return;
    }
    
    try {
      isFetchingProfile.current = true;
      setLoading(true);
      setError(null);
      fetchAttempts.current += 1;
      
      console.log('Fetching profile for user:', userId);
      
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        
        // If profile doesn't exist, create it
        if (fetchError.code === 'PGRST116' || (fetchError.message && fetchError.message.includes('not found'))) {
          console.log('Profile not found, attempting to create one');
          
          try {
            const { data: userData } = await supabase.auth.getUser();
            const email = userData?.user?.email || '';
            
            // Extract first and last name from email
            let firstName = 'User';
            let lastName = 'Profile';
            
            if (email) {
              const emailName = email.split('@')[0];
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
              lastName = email ? email.split('@')[0] : 'Profile';
            }
            
            console.log(`Creating profile with name: ${firstName} ${lastName}, email: ${email}`);
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: userId, 
                email,
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`.trim(),
                // Required fields from schema
                user_type: 'traveler',
                verification_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Onboarding fields
                onboarding_completed: false,
                onboarding_step: 'profile',
                profile_visibility: 'public',
                has_jet: false
              }])
              .select('*')
              .single();
            
            if (createError) {
              console.error('Error creating profile:', createError);
              setError('Failed to create profile');
            } else if (newProfile) {
              console.log('Profile created successfully:', newProfile);
              setProfile(newProfile as UserProfile);
              profileFetchAttempted.current = true;
              return;
            }
          } catch (createErr) {
            console.error('Error in profile creation:', createErr);
            setError('Failed to create profile');
          }
        } else {
          setError('Failed to load profile');
        }
      } else if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data as UserProfile);
        profileFetchAttempted.current = true;
      } else {
        console.log('No profile data found');
        setError('No profile found');
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      isFetchingProfile.current = false;
    }
  }, []);
  
  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      toast.error('You must be logged in to update your profile');
      return { error: new Error('User not authenticated') };
    }
    
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      // First, fetch the current profile to see what columns are available
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current profile:', fetchError);
        toast.error(`Error fetching profile: ${fetchError.message}`);
        return { error: fetchError };
      }
      
      // Log the current profile structure and the updates we're trying to apply
      console.log('Current profile structure:', currentProfile);
      console.log('Attempting to update with:', updates);
      
      // Filter updates to only include keys that exist in the current profile
      const safeUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        // Only include the key if it exists in the current profile or is a standard field
        // that we know should be in profiles (like first_name, last_name, etc.)
        const standardFields = [
          'first_name', 'last_name', 'full_name', 'avatar_url', 
          'bio', 'phone_number', 'website', 'location', 
          'company', 'position', 'verification_status', 'profile_visibility',
          'notification_preferences', 'privacy_settings' // Add our new fields to the standardFields list
        ];
                             
        if (key in currentProfile || standardFields.includes(key)) {
          // @ts-ignore - we're being careful about the keys
          safeUpdates[key] = updates[key];
        } else {
          console.warn(`Skipping update for field "${key}" as it doesn't exist in the profiles table`);
        }
      });
      
      console.log('Safe updates to apply:', safeUpdates);
      
      // Now update with only the fields that exist
      const { data, error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        toast.error(`Failed to update profile: ${error.message || error.code || JSON.stringify(error)}`);
        console.error('Error updating profile:', error);
        return { error };
      }
      
      setProfile(data as UserProfile);
      toast.success('Profile updated successfully');
      return { data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`An unexpected error occurred: ${errorMessage}`);
      console.error('Unexpected error updating profile:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Refresh profile data - public function to trigger a re-fetch
   */
  const refreshProfile = useCallback(() => {
    if (user?.id) {
      // Reset the fetch attempted flag to force a new fetch
      profileFetchAttempted.current = false;
      fetchAttempts.current = 0;
      fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);
  
  // Fetch profile on component mount or user change
  useEffect(() => {
    // Only fetch if we have a userId and haven't attempted a fetch yet
    if (user?.id && !profileFetchAttempted.current && !isFetchingProfile.current) {
      console.log('Initial profile fetch for userId:', user.id);
      fetchUserProfile(user.id);
    } else if (!user) {
      // Reset profile when user logs out
      setProfile(null);
      setLoading(false);
      profileFetchAttempted.current = false;
      fetchAttempts.current = 0;
    }
    
    // Don't add fetchUserProfile to the dependency array to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  
  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile
  };
} 