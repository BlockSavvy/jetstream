/**
 * Admin Dashboard Data Fetching Utilities
 * 
 * This file contains functions for fetching data from Supabase to populate
 * the admin dashboard pages. Compatible with both client and server components.
 */

import { createClient } from '@/lib/supabase';

// TypeScript interfaces for returned data types
export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  verification_status?: string;
  user_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JetShareOffer {
  id: string;
  user_id: string;
  matched_user_id?: string;
  flight_date: string;
  departure_location: string;
  arrival_location: string;
  total_flight_cost: number;
  requested_share_amount: number;
  status: 'open' | 'accepted' | 'completed';
  created_at: string;
  updated_at: string;
  user?: User;
  matched_user?: User;
}

export interface Jet {
  id: string;
  owner_id?: string;
  model: string;
  manufacturer: string;
  year: number;
  tail_number: string;
  capacity: number;
  range_nm: number;
  images?: string[];
  amenities?: Record<string, any>;
  home_base_airport: string;
  status: 'available' | 'maintenance' | 'unavailable';
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  owner?: User;
}

export interface Crew {
  id: string;
  user_id?: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  specializations: string[];
  social_links?: Record<string, any>;
  ratings_avg?: number;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

export interface Flight {
  id: string;
  jet_id?: string;
  origin_airport?: string;
  destination_airport?: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  base_price: number;
  status: 'scheduled' | 'boarding' | 'in_air' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  jet?: Jet;
  origin?: {
    code: string;
    name: string;
    city: string;
  };
  destination?: {
    code: string;
    name: string;
    city: string;
  };
}

export interface DashboardMetrics {
  userCount: number;
  jetShareCount: number;
  jetsCount: number;
  crewCount: number;
}

/**
 * Fetch JetShare offers with user details
 */
export async function getJetShareOffers(): Promise<JetShareOffer[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id(id, first_name, last_name, email, avatar_url),
      matched_user:matched_user_id(id, first_name, last_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching JetShare offers:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch user data with role information
 */
export async function getUsers(): Promise<User[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch jets data with owner information
 */
export async function getJets(): Promise<Jet[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jets')
    .select(`
      *,
      owner:owner_id(id, first_name, last_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching jets:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch crews data
 */
export async function getCrews(): Promise<Crew[]> {
  const supabase = createClient();
  
  // First, fetch the crews without trying to join with user profiles
  const { data: crewsData, error: crewsError } = await supabase
    .from('pilots_crews')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (crewsError) {
    console.error('Error fetching crews:', crewsError);
    throw crewsError;
  }

  // If we have crew data and there are user_ids, fetch the corresponding users
  if (crewsData && crewsData.length > 0) {
    // Collect all user IDs that are not null
    const userIds = crewsData
      .map(crew => crew.user_id)
      .filter(id => id !== null && id !== undefined);
    
    // If we have user IDs, fetch the corresponding user data
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching crew users:', usersError);
        // Continue anyway, we'll just return crews without user data
      }
      
      // If we got user data, join it with the crews
      if (usersData && usersData.length > 0) {
        return crewsData.map(crew => {
          const user = usersData.find(user => user.id === crew.user_id);
          return {
            ...crew,
            user: user ? [user] : undefined
          };
        });
      }
    }
  }
  
  // If we have no user data or no crews, just return the crews as is
  return crewsData || [];
}

/**
 * Fetch general flights/offers
 */
export async function getFlightOffers(): Promise<Flight[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('flights')
    .select(`
      *,
      jet:jet_id(id, model, manufacturer, tail_number),
      origin:origin_airport(code, name, city),
      destination:destination_airport(code, name, city)
    `)
    .order('departure_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching flight offers:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get dashboard overview metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createClient();
  
  // Get total user count
  const { count: userCount, error: userError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  if (userError) {
    console.error('Error counting users:', userError);
    throw userError;
  }
  
  // Get total active JetShare offers
  const { count: jetShareCount, error: jetShareError } = await supabase
    .from('jetshare_offers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');
  
  if (jetShareError) {
    console.error('Error counting JetShare offers:', jetShareError);
    throw jetShareError;
  }
  
  // Get available jets
  const { count: jetsCount, error: jetsError } = await supabase
    .from('jets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');
  
  if (jetsError) {
    console.error('Error counting jets:', jetsError);
    throw jetsError;
  }
  
  // Get crew count
  const { count: crewCount, error: crewError } = await supabase
    .from('pilots_crews')
    .select('*', { count: 'exact', head: true });
  
  if (crewError) {
    console.error('Error counting crews:', crewError);
    throw crewError;
  }
  
  return {
    userCount: userCount || 0,
    jetShareCount: jetShareCount || 0,
    jetsCount: jetsCount || 0,
    crewCount: crewCount || 0
  };
}

/**
 * Get recent JetShare offers with user details for the dashboard
 */
export async function getRecentJetShareOffers(limit = 5) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jetshare_offers')
    .select(`
      id,
      user_id,
      departure_location,
      arrival_location,
      flight_date,
      status,
      created_at,
      updated_at,
      user:user_id(id, first_name, last_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching recent JetShare offers:', error);
    throw error;
  }
  
  return data || [];
} 