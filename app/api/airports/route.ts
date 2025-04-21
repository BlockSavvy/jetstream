import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Initialize Supabase client with service role key to bypass authentication issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Environment-dependent configuration
const CONFIG = {
  // In development mode, we'll log warnings when fallbacks are used
  isDev: process.env.NODE_ENV === 'development',
  // Disable fallbacks to ensure we always use database data
  useFallbacks: false,
  // Track telemetry - which could be extended to send to a monitoring service
  trackTelemetry: true,
  logPrefix: '[AIRPORTS API]',
};

// Default placeholder airport map path
const PLACEHOLDER_AIRPORT_MAP = '/images/airports/placeholder_airport_map.png';

// Fallback airport data in case the database query returns no results
const fallbackAirports: Airport[] = [
  { code: "EDDB", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", lat: 52.3667, lng: 13.5033, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "OMDB", name: "Dubai International Airport", city: "Dubai", country: "UAE", lat: 25.2528, lng: 55.3644, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "VHHH", name: "Hong Kong International Airport", city: "Hong Kong", country: "China", lat: 22.3080, lng: 113.9185, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KLAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "USA", lat: 36.0840, lng: -115.1537, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "EGLL", name: "London Heathrow Airport", city: "London", country: "UK", lat: 51.4700, lng: -0.4543, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "EGGW", name: "London Luton Airport", city: "London", country: "UK", lat: 51.8747, lng: -0.3689, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KVAN", name: "Van Nuys Airport", city: "Los Angeles", country: "USA", lat: 34.2098, lng: -118.4896, is_private: true, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KLAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA", lat: 33.9416, lng: -118.4085, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KMIA", name: "Miami International Airport", city: "Miami", country: "USA", lat: 25.7932, lng: -80.2906, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "EDDM", name: "Munich Airport", city: "Munich", country: "Germany", lat: 48.3538, lng: 11.7861, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "VIDP", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", lat: 28.5562, lng: 77.1000, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KJFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781, image_url: "/images/airports/kjfk.png" },
  { code: "KPBI", name: "Palm Beach International Airport", city: "Palm Beach", country: "USA", lat: 26.6832, lng: -80.0956, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "LFPB", name: "Paris–Le Bourget Airport", city: "Paris", country: "France", lat: 48.9698, lng: 2.4383, is_private: true, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KSFO", name: "San Francisco International Airport", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.3790, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KSDL", name: "Scottsdale Airport", city: "Scottsdale", country: "USA", lat: 33.6229, lng: -111.9107, is_private: true, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "YSSY", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro", country: "USA", lat: 40.8499, lng: -74.0610, is_private: true, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "RJTT", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains", country: "USA", lat: 41.0670, lng: -73.7076, is_private: true, image_url: PLACEHOLDER_AIRPORT_MAP },
  { code: "KFLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lng: -80.1506, image_url: "/images/airports/kfll.png" }
];

// Telemetry capture for monitoring
const telemetry = {
  totalRequests: 0,
  fallbacksUsed: 0,
  errors: {} as Record<string, number>,
  lastErrorTime: null as Date | null,
  
  trackRequest() {
    this.totalRequests++;
  },
  
  trackFallback(reason: string) {
    this.fallbacksUsed++;
    if (CONFIG.isDev) {
      console.warn(`${CONFIG.logPrefix} Using fallback data: ${reason}`);
    }
  },
  
  trackError(type: string, error: any) {
    if (!this.errors[type]) {
      this.errors[type] = 0;
    }
    this.errors[type]++;
    this.lastErrorTime = new Date();
    
    // Log the error in development
    if (CONFIG.isDev) {
      console.error(`${CONFIG.logPrefix} Error (${type}):`, error);
    }
  },
  
  getStats() {
    return {
      totalRequests: this.totalRequests,
      fallbacksUsed: this.fallbacksUsed,
      fallbackPercentage: this.totalRequests > 0 
        ? Math.round((this.fallbacksUsed / this.totalRequests) * 100) 
        : 0,
      errors: this.errors,
      lastErrorTime: this.lastErrorTime
    };
  }
};

export async function GET(request: NextRequest) {
  try {
    // Track the request
    if (CONFIG.trackTelemetry) {
      telemetry.trackRequest();
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const codesParam = url.searchParams.get('codes') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const includeTelemetry = url.searchParams.get('telemetry') === 'true' && CONFIG.isDev;
    
    // Parse codes parameter (comma-separated list of airport codes)
    const codes = codesParam ? codesParam.split(',').map(c => c.trim().toUpperCase()) : [];
    
    console.log(`${CONFIG.logPrefix} Fetching airports data with query: "${query}", codes: [${codes.join(', ')}], limit: ${limit}`);
    
    // Check if we should use fallbacks before even trying the database
    if (!CONFIG.useFallbacks && url.searchParams.get('forceFallback') !== 'true') {
      console.log(`${CONFIG.logPrefix} Fallbacks disabled by configuration`);
    }
    
    // If forceFallback is set (for testing), skip DB query
    if (url.searchParams.get('forceFallback') === 'true' && CONFIG.isDev) {
      if (CONFIG.trackTelemetry) {
        telemetry.trackFallback('forced via query parameter');
      }
      
      let filteredFallbacks;
      
      // If codes are provided, filter by codes
      if (codes.length > 0) {
        filteredFallbacks = fallbackAirports.filter(airport => 
          codes.includes(airport.code)
        ).slice(0, limit);
      } 
      // Otherwise filter by query text
      else if (query && query.length > 1) {
        filteredFallbacks = filterFallbackData(query, limit);
      } 
      // Or just return all (up to limit)
      else {
        filteredFallbacks = fallbackAirports.slice(0, limit);
      }
      
      return createResponse(filteredFallbacks, includeTelemetry);
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      supabaseUrl,
      serviceKey || supabaseKey // Fallback to anon key if service key is not available
    );
    
    // FIXED: Query only the fields that exist in the database schema
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
      if (CONFIG.trackTelemetry) {
        telemetry.trackError('database_query', error);
      }
      
      console.error(`${CONFIG.logPrefix} Error fetching airports:`, error);
      
      // Always return the error so we can identify database issues
      return NextResponse.json(
        { error: error.message, code: error.code || 'UNKNOWN' }, 
        { status: 500 }
      );
    }
    
    // If no airports were returned from database, return empty array
    if (!airports || airports.length === 0) {
      console.log(`${CONFIG.logPrefix} Database returned no results`);
      
      // Return an empty array to clearly indicate no results from database
      return createResponse([], includeTelemetry);
    }
    
    // UPDATED: Enhance airport data with geo coordinates and add missing fields from fallback data
    const enhancedAirports = airports.map(dbAirport => {
      // Start with the database data
      const airport: Airport = {
        code: dbAirport.code,
        name: dbAirport.name,
        city: dbAirport.city,
        country: dbAirport.country,
        is_private: dbAirport.is_private || false,
        image_url: PLACEHOLDER_AIRPORT_MAP, // Now using the placeholder instead of null
      };
      
      // Find if we have additional data for this airport code in our fallback data
      const fallbackMatch = fallbackAirports.find(f => f.code === airport.code);
      if (fallbackMatch) {
        // Add geo data from fallback
        airport.lat = fallbackMatch.lat;
        airport.lng = fallbackMatch.lng;
        
        // Add image_url and route_map_template if available in fallback
        if (fallbackMatch.image_url) airport.image_url = fallbackMatch.image_url;
        if (fallbackMatch.route_map_template) airport.route_map_template = fallbackMatch.route_map_template;
        
        // Ensure is_private is set correctly
        if (fallbackMatch.is_private) airport.is_private = fallbackMatch.is_private;
      }
      
      // Try to extract coordinates from the location field if present
      if (dbAirport.location && typeof dbAirport.location === 'object') {
        try {
          // Attempt to extract coordinates from PostgreSQL geometry point
          // This assumes location is stored as a PostGIS point or similar format
          const locationObj = dbAirport.location as any;
          if (locationObj.coordinates && Array.isArray(locationObj.coordinates) && locationObj.coordinates.length >= 2) {
            // PostGIS format is typically [longitude, latitude]
            airport.lng = locationObj.coordinates[0];
            airport.lat = locationObj.coordinates[1];
          }
        } catch (e) {
          console.warn(`${CONFIG.logPrefix} Could not extract coordinates from location field for ${airport.code}:`, e);
        }
      }
      
      return airport;
    });
    
    // Return the database results with any available geo enhancements
    console.log(`${CONFIG.logPrefix} Retrieved ${enhancedAirports.length} airports from database for query "${query || codes.join(', ')}"`);
    return createResponse(enhancedAirports, includeTelemetry);
    
  } catch (error) {
    if (CONFIG.trackTelemetry) {
      telemetry.trackError('unexpected', error);
    }
    
    console.error(`${CONFIG.logPrefix} Unexpected error:`, error);
    
    // Return the error for better debugging
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', code: 'UNEXPECTED' }, 
      { status: 500 }
    );
  }
}

// Helper function to filter fallback data
function filterFallbackData(query: string, limit: number): Airport[] {
  const querylc = query.toLowerCase();
  return fallbackAirports
    .filter(airport => 
      airport.city.toLowerCase().includes(querylc) || 
      airport.name.toLowerCase().includes(querylc) || 
      airport.code.toLowerCase().includes(querylc) ||
      airport.country.toLowerCase().includes(querylc)
    )
    .slice(0, limit);
}

// Helper function to create response with optional telemetry
function createResponse(data: Airport[], includeTelemetry: boolean) {
  if (includeTelemetry) {
    return NextResponse.json({
      data,
      _meta: {
        source: "database",
        count: data.length,
        telemetry: telemetry.getStats(),
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return NextResponse.json(data);
} 