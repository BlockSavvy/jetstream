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
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        toast.error('Failed to update profile');
        console.error('Error updating profile:', error);
        return { error };
      }
      
      setProfile(data as UserProfile);
      toast.success('Profile updated successfully');
      return { data };
    } catch (err) {
      toast.error('An unexpected error occurred');
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