"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

export type UserTravelPreferences = {
  id?: string;
  user_id: string;
  travel_interests: string[];
  social_preferences: string[];
  preferred_destinations: string[];
  urgency_preferences: string[];
  created_at?: string;
  updated_at?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  position?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  phone_number?: string;
  travel_preferences?: UserTravelPreferences;
  notification_preferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy_settings?: {
    show_profile: boolean;
    show_travel_history: boolean;
    show_upcoming_flights: boolean;
  };
  created_at?: string;
  updated_at?: string;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
        
        // Create a new profile if not found
        if (profileError.code === "PGRST116") { // Row not found
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select("*")
            .single();
            
          if (insertError) {
            throw insertError;
          }
          
          // Use the newly created profile
          const fullProfile: UserProfile = {
            ...newProfile,
            email: user.email || "",
          };
          
          setProfile(fullProfile);
          setLoading(false);
          return;
        }
        
        throw profileError;
      }

      // Fetch travel preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from("travel_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (preferencesError && preferencesError.code !== "PGRST116") {
        // PGRST116 is "not found", we can ignore this as the user might not have travel preferences yet
        console.warn("Error fetching travel preferences:", preferencesError);
      }

      // Combine profile and preferences
      const fullProfile: UserProfile = {
        ...profileData,
        email: user.email || "",
        travel_preferences: preferencesData || undefined,
      };

      setProfile(fullProfile);
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      // Make sure we capture the detailed error message or fallback to a generic one
      setError(err.message || err.details || JSON.stringify(err) || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, supabase]);

  // Update profile in Supabase
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return { error: new Error("User not authenticated") };

    try {
      // Separate travel preferences from other profile updates
      const { travel_preferences, ...profileUpdates } = updates;

      // Update profile if there are profile updates
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", user.id);

        if (profileError) throw profileError;
      }

      // Update travel preferences if provided
      if (travel_preferences) {
        // Check if travel preferences exist
        const { data: existingPrefs } = await supabase
          .from("travel_preferences")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (existingPrefs) {
          // Update existing preferences
          const { error: prefError } = await supabase
            .from("travel_preferences")
            .update({
              ...travel_preferences,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          if (prefError) throw prefError;
        } else {
          // Insert new preferences
          const { error: prefError } = await supabase
            .from("travel_preferences")
            .insert({
              ...travel_preferences,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (prefError) throw prefError;
        }
      }

      // Refetch profile to get updated data
      await fetchProfile();
      return { success: true };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { error };
    }
  };

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile: fetchProfile,
  };
} 