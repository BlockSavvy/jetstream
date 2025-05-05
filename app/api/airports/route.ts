import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

// Enhanced airport interface with geolocation data and images
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
  lat?: number;
  lng?: number;
  image_url?: string | null;
  route_map_template?: string | null;
}

// Default placeholder airport map path
const PLACEHOLDER_AIRPORT_MAP = '/images/airports/placeholder_airport_map.png';

export async function GET(request: NextRequest) {
  // Always set proper headers to prevent HTML responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  };
  
  console.log('[AIRPORTS API] Request received', { url: request.url });
  
  try {
    // Get query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const codesParam = url.searchParams.get('codes') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Parse codes parameter (comma-separated list of airport codes)
    const codes = codesParam ? codesParam.split(',').map(c => c.trim().toUpperCase()) : [];
    
    console.log(`[AIRPORTS API] Fetching airports data with query: "${query}", codes: [${codes.join(', ')}], limit: ${limit}`);
    
    // Create Supabase client using the shared helper function
    const supabase = await createClient();
    
    // Query only the fields that exist in the database schema
    let airportsQuery = supabase
      .from('airports')
      .select('code, name, city, country, location, is_private');
    
    // If codes parameter exists, filter by exact airport codes
    if (codes.length > 0) {
      airportsQuery = airportsQuery.in('code', codes);
    }
    // If query parameter exists, filter results
    else if (query && query.length > 1) {
      airportsQuery = airportsQuery.or(
        `city.ilike.%${query}%,name.ilike.%${query}%,code.ilike.%${query}%,country.ilike.%${query}%`
      );
    }
    
    // Execute the query with limit and order
    const { data: airports, error } = await airportsQuery
      .order('city')
      .limit(limit);
    
    if (error) {
      console.error(`[AIRPORTS API] Database error:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch airports from database', details: error.message },
        { status: 500, headers }
      );
    }
    
    if (!airports || airports.length === 0) {
      console.log(`[AIRPORTS API] No airports found in database for query`);
      return NextResponse.json([], { headers });
    }
    
    // Enhance airport data with additional info
    const enhancedAirports = airports.map((dbAirport: any) => {
      // Start with the database data
      const airport: Airport = {
        code: dbAirport.code,
        name: dbAirport.name,
        city: dbAirport.city,
        country: dbAirport.country,
        is_private: dbAirport.is_private || false,
        image_url: PLACEHOLDER_AIRPORT_MAP, // Default image
      };
      
      // Try to extract coordinates from the location field if present
      if (dbAirport.location && typeof dbAirport.location === 'object') {
        try {
          // Attempt to extract coordinates from PostgreSQL geometry point
          const locationObj = dbAirport.location as any;
          if (locationObj.coordinates && Array.isArray(locationObj.coordinates) && locationObj.coordinates.length >= 2) {
            // PostGIS format is typically [longitude, latitude]
            airport.lng = locationObj.coordinates[0];
            airport.lat = locationObj.coordinates[1];
          }
        } catch (e) {
          console.warn(`[AIRPORTS API] Could not extract coordinates for ${airport.code}:`, e);
        }
      }
      
      return airport;
    });
    
    console.log(`[AIRPORTS API] Successfully retrieved ${enhancedAirports.length} airports from database`);
    return NextResponse.json(enhancedAirports, { headers });
    
  } catch (error) {
    console.error(`[AIRPORTS API] Unexpected error:`, error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers }
    );
  }
} 