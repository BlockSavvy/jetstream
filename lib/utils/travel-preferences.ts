import { createClient } from "@/lib/supabase";
import { UserTravelPreferences } from "@/hooks/useUserProfile";

/**
 * Fetch a user's travel preferences
 * @param userId The user ID to fetch preferences for
 * @returns The user's travel preferences or null if not found
 */
export async function fetchTravelPreferences(userId: string): Promise<UserTravelPreferences | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("travel_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
      
    if (error) {
      if (error.code === "PGRST116") { // Record not found
        return null;
      }
      throw error;
    }
    
    return data as UserTravelPreferences;
  } catch (error) {
    console.error("Error fetching travel preferences:", error);
    return null;
  }
}

/**
 * Save or update a user's travel preferences
 * @param preferences The travel preferences to save
 * @returns Success or error result
 */
export async function saveTravelPreferences(
  preferences: UserTravelPreferences
): Promise<{ success: boolean; error?: any }> {
  const supabase = createClient();
  
  try {
    // Check if travel preferences exist
    const { data: existingPrefs } = await supabase
      .from("travel_preferences")
      .select("id")
      .eq("user_id", preferences.user_id)
      .single();
      
    if (existingPrefs) {
      // Update existing preferences
      const { error } = await supabase
        .from("travel_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", preferences.user_id);
        
      if (error) throw error;
    } else {
      // Insert new preferences
      const { error } = await supabase
        .from("travel_preferences")
        .insert({
          ...preferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving travel preferences:", error);
    return { success: false, error };
  }
}

/**
 * Matches a user with flight recommendations based on their preferences
 * @param userId The user ID to match
 * @returns Array of flight IDs sorted by match score
 */
export async function matchUserWithFlights(userId: string): Promise<string[]> {
  // This is where we would integrate with Cohere and Pinecone
  // For now, return a simple array of flight IDs
  return ["flight-1", "flight-2", "flight-3"];
} 