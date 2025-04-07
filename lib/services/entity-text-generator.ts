import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generates text representation of an entity for embedding
 * This is a unified utility to consistently generate text for various entities
 * 
 * @param supabase - Supabase client instance
 * @param objectType - Type of entity (jetshare_offer, flight, user, crew)
 * @param objectId - UUID of the entity
 * @returns Object containing generated text and metadata
 */
export async function generateEntityText(
  supabase: SupabaseClient,
  objectType: 'jetshare_offer' | 'flight' | 'user' | 'crew',
  objectId: string
): Promise<{
  text: string;
  metadata: {
    id: string;
    type: string;
    [key: string]: any;
  };
  recordId: string;
}> {
  switch (objectType) {
    case 'jetshare_offer':
      return generateJetShareOfferText(supabase, objectId);
    case 'flight':
      return generateFlightText(supabase, objectId);
    case 'user':
      return generateUserProfileText(supabase, objectId);
    case 'crew':
      return generateCrewText(supabase, objectId);
    default:
      throw new Error(`Unsupported entity type: ${objectType}`);
  }
}

/**
 * Generates text representation of a JetShare offer
 */
async function generateJetShareOfferText(supabase: SupabaseClient, offerId: string) {
  // Fetch offer details
  const { data: offer, error: offerError } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      aircraft_model:aircraft_model_id(name, description, manufacturer),
      creator:creator_id(first_name, last_name, email)
    `)
    .eq('id', offerId)
    .single();

  if (offerError || !offer) {
    throw new Error(`Failed to fetch offer data: ${offerError?.message || 'Offer not found'}`);
  }

  // Build metadata for storage
  const metadata = {
    id: offer.id,
    type: 'jetshare_offer',
    status: offer.status,
    price_per_seat: offer.price_per_seat,
    route: `${offer.departure_airport} to ${offer.arrival_airport}`,
    aircraft: offer.aircraft_model?.name || 'Unknown aircraft',
    date: offer.departure_date_time,
    creator_id: offer.creator_id
  };

  // Generate a text representation
  const text = `
    JetShare Offer: ${offer.id}
    Route: ${offer.departure_airport} to ${offer.arrival_airport}
    Aircraft: ${offer.aircraft_model?.name || 'Unknown'} by ${offer.aircraft_model?.manufacturer || 'Unknown'}
    Date/Time: ${new Date(offer.departure_date_time).toLocaleString()}
    Duration: ${offer.flight_duration_minutes} minutes
    Status: ${offer.status}
    Price per seat: $${offer.price_per_seat}
    Total seats: ${offer.total_seats}
    Available seats: ${offer.available_seats}
    Description: ${offer.description || 'No description provided'}
    Created by: ${offer.creator?.first_name || ''} ${offer.creator?.last_name || ''} (${offer.creator?.email || 'Unknown'})
    Created at: ${new Date(offer.created_at).toLocaleString()}
    Aircraft details: ${offer.aircraft_model?.description || 'No details available'}
    Preferences: ${offer.preferences || 'No specific preferences'}
    Additional notes: ${offer.notes || 'No additional notes'}
  `.trim().replace(/\n\s+/g, '\n').replace(/\s+/g, ' ');

  return {
    text,
    metadata,
    recordId: `offer-${offer.id}`
  };
}

/**
 * Generates text representation of a Flight
 */
async function generateFlightText(supabase: SupabaseClient, flightId: string) {
  // Fetch flight details
  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .select(`
      *,
      jet:jet_id(name, model, description),
      pilot:pilot_id(name, experience, certification)
    `)
    .eq('id', flightId)
    .single();

  if (flightError || !flight) {
    throw new Error(`Failed to fetch flight data: ${flightError?.message || 'Flight not found'}`);
  }

  // Build metadata for storage
  const metadata = {
    id: flight.id,
    type: 'flight',
    status: flight.status,
    route: `${flight.departure_airport} to ${flight.arrival_airport}`,
    jet: flight.jet?.name || 'Unknown jet',
    date: flight.departure_date_time,
    price: flight.price,
    seats_available: flight.seats_available
  };

  // Generate a text representation
  const text = `
    Flight: ${flight.id}
    Route: ${flight.departure_airport} to ${flight.arrival_airport}
    Jet: ${flight.jet?.name || 'Unknown'} (${flight.jet?.model || 'Unknown model'})
    Date/Time: ${new Date(flight.departure_date_time).toLocaleString()}
    Arrival: ${new Date(flight.arrival_date_time).toLocaleString()}
    Status: ${flight.status}
    Price: $${flight.price}
    Available seats: ${flight.seats_available}
    Pilot: ${flight.pilot?.name || 'Unassigned'}
    Flight number: ${flight.flight_number || 'Unassigned'}
    Description: ${flight.description || 'No description provided'}
    Jet details: ${flight.jet?.description || 'No details available'}
    Additional services: ${flight.additional_services || 'None'}
  `.trim().replace(/\n\s+/g, '\n').replace(/\s+/g, ' ');

  return {
    text,
    metadata,
    recordId: `flight-${flight.id}`
  };
}

/**
 * Generates text representation of a User Profile
 */
async function generateUserProfileText(supabase: SupabaseClient, userId: string) {
  // Fetch user profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      preferences:user_preferences(*)
    `)
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to fetch user profile: ${profileError?.message || 'Profile not found'}`);
  }

  // Build metadata for storage
  const metadata = {
    id: profile.id,
    type: 'user',
    name: `${profile.first_name} ${profile.last_name}`,
    email: profile.email,
    member_since: profile.created_at
  };

  // Generate a text representation
  const text = `
    User: ${profile.id}
    Name: ${profile.first_name} ${profile.last_name}
    Email: ${profile.email}
    Phone: ${profile.phone || 'Not provided'}
    Location: ${profile.location || 'Not specified'}
    Bio: ${profile.bio || 'No bio provided'}
    Member since: ${new Date(profile.created_at).toLocaleString()}
    Travel preferences: ${profile.preferences ? JSON.stringify(profile.preferences) : 'No preferences set'}
    Verified: ${profile.is_verified ? 'Yes' : 'No'}
    Status: ${profile.status || 'Active'}
  `.trim().replace(/\n\s+/g, '\n').replace(/\s+/g, ' ');

  return {
    text,
    metadata,
    recordId: `user-${profile.id}`
  };
}

/**
 * Generates text representation of a Crew Member
 */
async function generateCrewText(supabase: SupabaseClient, crewId: string) {
  // Fetch crew details
  const { data: crew, error: crewError } = await supabase
    .from('pilots_crews')
    .select(`
      *,
      certifications(*),
      reviews(*)
    `)
    .eq('id', crewId)
    .single();

  if (crewError || !crew) {
    throw new Error(`Failed to fetch crew data: ${crewError?.message || 'Crew not found'}`);
  }

  // Calculate average rating if reviews exist
  let avgRating = 0;
  if (crew.reviews && crew.reviews.length > 0) {
    avgRating = crew.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / crew.reviews.length;
  }

  // Build metadata for storage
  const metadata = {
    id: crew.id,
    type: 'crew',
    name: crew.name,
    role: crew.role,
    experience_years: crew.experience_years,
    rating: avgRating
  };

  // Format certifications
  const certifications = crew.certifications 
    ? crew.certifications.map((cert: any) => `${cert.name} (${cert.issued_date})`).join(', ')
    : 'No certifications recorded';

  // Generate a text representation
  const text = `
    Crew: ${crew.id}
    Name: ${crew.name}
    Role: ${crew.role || 'Unspecified role'}
    Experience: ${crew.experience_years || 0} years
    Rating: ${avgRating.toFixed(1)} out of 5 (${crew.reviews ? crew.reviews.length : 0} reviews)
    Bio: ${crew.bio || 'No bio provided'}
    Specialties: ${crew.specialties || 'None listed'}
    Certifications: ${certifications}
    Languages: ${crew.languages || 'Not specified'}
    Available: ${crew.is_available ? 'Yes' : 'No'}
    Home base: ${crew.home_base || 'Not specified'}
  `.trim().replace(/\n\s+/g, '\n').replace(/\s+/g, ' ');

  return {
    text,
    metadata,
    recordId: `crew-${crew.id}`
  };
} 