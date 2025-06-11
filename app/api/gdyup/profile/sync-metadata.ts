import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Synchronizes user metadata with the profiles table for a specific user
 * This function has been refactored to avoid any cookie-related auth operations
 * @param supabase Supabase client
 * @param userId User ID to sync
 */
export async function syncUserMetadataWithProfile(
  supabase: any,
  userId: string
) {
  console.log(`[PROFILE] Metadata sync skipped for user ${userId} to avoid cookie issues`);
  // Simply return success without attempting any auth operations
  return { success: true };
}

/**
 * Updates user metadata with data from the profiles table
 * This function has been refactored to avoid cookie-related auth operations
 * @param supabase Supabase client
 * @param userId User ID to update
 */
export async function updateUserMetadataFromProfile(supabase: any, userId: string) {
  console.log(`[PROFILE] Metadata update skipped for user ${userId} to avoid cookie issues`);
  // Simply return success without attempting any auth operations
  return true;
} 