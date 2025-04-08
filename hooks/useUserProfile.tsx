"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { toast } from 'sonner';

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
  
  /**
   * Fetch user profile from Supabase
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    // If already fetching or already attempted, skip
    if (isFetchingProfile.current || !userId) {
      return;
    }
    
    try {
      isFetchingProfile.current = true;
      setLoading(true);
      setError(null);
      
      console.log('Fetching profile for user:', userId);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
        return;
      }
      
      setProfile(data as UserProfile);
      profileFetchAttempted.current = true;
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
      const supabase = createClient();
      
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
      fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);
  
  // Fetch profile on component mount or user change
  useEffect(() => {
    if (user?.id && !profileFetchAttempted.current) {
      fetchUserProfile(user.id);
    } else if (!user) {
      // Reset profile when user logs out
      setProfile(null);
      setLoading(false);
      profileFetchAttempted.current = false;
    }
  }, [user, fetchUserProfile]);
  
  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile
  };
} 