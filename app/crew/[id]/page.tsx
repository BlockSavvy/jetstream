import { Metadata } from 'next';
import { CrewMember } from '@/lib/types/crew.types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import CrewDetailClient from './client';

export const dynamic = 'force-dynamic';

async function getCrewData(id: string): Promise<CrewMember | null> {
  try {
    console.log('Server fetching crew data for ID:', id);
    
    // Use the existing createClient function
    const supabase = await createClient();
    
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (crewError) {
      console.error('Error fetching crew member:', crewError);
      return null;
    }
    
    if (!crewData) {
      console.error('No crew data found for ID:', id);
      return null;
    }
    
    // Get reviews for the crew member - if this fails, don't fail the whole request
    let reviewsData = [];
    try {
      // First, check if the crew_reviews table exists and has the expected structure
      const { data: reviewCheck, error: reviewCheckError } = await supabase
        .from('crew_reviews')
        .select('id')
        .limit(1);
      
      if (reviewCheckError) {
        console.error('Error checking crew_reviews table:', reviewCheckError);
      } else if (reviewCheck !== null) {
        // If table exists, get the reviews but avoid the problematic join
        const { data, error } = await supabase
          .from('crew_reviews')
          .select('*')
          .eq('crew_id', id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching crew reviews:', error);
        } else if (data && data.length > 0) {
          // If we have reviews, try to get user information separately
          reviewsData = await Promise.all(data.map(async (review) => {
            // Only try to get user info if user_id exists
            if (review.user_id) {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', review.user_id)
                .single();
              
              if (userError) {
                console.error('Error fetching user data for review:', userError);
                return {
                  ...review,
                  user: undefined
                };
              }
              
              return {
                ...review,
                user: userData ? {
                  name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Anonymous',
                  avatarUrl: userData.avatar_url
                } : undefined
              };
            }
            
            return {
              ...review,
              user: undefined
            };
          }));
        } else {
          reviewsData = data || [];
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching reviews:', error);
    }
    
    // Get specialized flights for the crew member - if this fails, don't fail the whole request
    let flightsData = [];
    try {
      const { data, error } = await supabase
        .from('specialized_flights')
        .select(`
          *,
          flights:flight_id (
            *,
            jets:jet_id (*),
            origin:origin_airport (*),
            destination:destination_airport (*)
          )
        `)
        .eq('crew_id', id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching specialized flights:', error);
      } else {
        flightsData = data || [];
      }
    } catch (error) {
      console.error('Unexpected error fetching flights:', error);
    }
    
    // Transform data to match our types
    const transformedCrew = {
      id: crewData.id,
      userId: crewData.user_id,
      name: crewData.name,
      bio: crewData.bio,
      profileImageUrl: crewData.profile_image_url,
      ratingsAvg: crewData.ratings_avg,
      specializations: crewData.specializations || [],
      socialLinks: crewData.social_links || {},
      isCaptain: crewData.is_captain || false,
      dedicatedJetOwnerId: crewData.dedicated_jet_owner_id,
      yearsOfExperience: crewData.years_of_experience,
      availability: crewData.availability,
      reviews: reviewsData,
      specializedFlights: flightsData.map(flight => ({
        id: flight.id,
        flightId: flight.flight_id,
        title: flight.title,
        theme: flight.theme,
        description: flight.description,
        crewId: flight.crew_id,
        nftTicketed: flight.nft_ticketed,
        seatsAvailable: flight.seats_available,
        createdAt: flight.created_at,
        updatedAt: flight.updated_at,
        flight: flight.flights
      }))
    };
    
    return transformedCrew;
  } catch (error) {
    console.error('Error in getCrewData:', error);
    return null;
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const crew = await getCrewData(params.id);
  
  if (!crew) {
    return {
      title: 'Crew Member Not Found',
      description: 'The requested crew member could not be found.'
    };
  }
  
  return {
    title: `${crew.name} - JetStream Crew`,
    description: crew.bio?.slice(0, 160) || `${crew.name} is a specialized crew member offering unique experiences during your private jet flights.`
  };
}

export default async function CrewDetailPage({ params }: { params: { id: string } }) {
  // Get crew data server-side using the ID directly from params
  const crew = await getCrewData(params.id);
  
  // If no crew data, return 404
  if (!crew) {
    notFound();
  }
  
  return <CrewDetailClient crew={crew} />;
} 