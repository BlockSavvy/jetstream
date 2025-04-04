import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Enhanced airport interface with geolocation data
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
  lat?: number;
  lng?: number;
}

// Environment-dependent configuration
const CONFIG = {
  // In development mode, we'll log warnings when fallbacks are used
  isDev: process.env.NODE_ENV === 'development',
  // Ability to toggle fallbacks off for testing database connectivity issues
  useFallbacks: process.env.USE_FALLBACKS !== 'false',
  // Track telemetry - which could be extended to send to a monitoring service
  trackTelemetry: true,
  logPrefix: '[AIRPORTS API]',
};

// Fallback airport data in case the database query returns no results
const fallbackAirports: Airport[] = [
  { code: "EDDB", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", lat: 52.3667, lng: 13.5033 },
  { code: "OMDB", name: "Dubai International Airport", city: "Dubai", country: "UAE", lat: 25.2528, lng: 55.3644 },
  { code: "VHHH", name: "Hong Kong International Airport", city: "Hong Kong", country: "China", lat: 22.3080, lng: 113.9185 },
  { code: "KLAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "USA", lat: 36.0840, lng: -115.1537 },
  { code: "EGLL", name: "London Heathrow Airport", city: "London", country: "UK", lat: 51.4700, lng: -0.4543 },
  { code: "EGGW", name: "London Luton Airport", city: "London", country: "UK", lat: 51.8747, lng: -0.3689 },
  { code: "KVAN", name: "Van Nuys Airport", city: "Los Angeles", country: "USA", lat: 34.2098, lng: -118.4896, is_private: true },
  { code: "KLAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA", lat: 33.9416, lng: -118.4085 },
  { code: "KMIA", name: "Miami International Airport", city: "Miami", country: "USA", lat: 25.7932, lng: -80.2906 },
  { code: "EDDM", name: "Munich Airport", city: "Munich", country: "Germany", lat: 48.3538, lng: 11.7861 },
  { code: "VIDP", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", lat: 28.5562, lng: 77.1000 },
  { code: "KJFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781 },
  { code: "KPBI", name: "Palm Beach International Airport", city: "Palm Beach", country: "USA", lat: 26.6832, lng: -80.0956 },
  { code: "LFPB", name: "Paris–Le Bourget Airport", city: "Paris", country: "France", lat: 48.9698, lng: 2.4383, is_private: true },
  { code: "KSFO", name: "San Francisco International Airport", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.3790 },
  { code: "KSDL", name: "Scottsdale Airport", city: "Scottsdale", country: "USA", lat: 33.6229, lng: -111.9107, is_private: true },
  { code: "YSSY", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753 },
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro", country: "USA", lat: 40.8499, lng: -74.0610, is_private: true },
  { code: "RJTT", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798 },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains", country: "USA", lat: 41.0670, lng: -73.7076, is_private: true }
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

export async function GET(request: Request) {
  try {
    // Track the request
    if (CONFIG.trackTelemetry) {
      telemetry.trackRequest();
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const includeTelemetry = url.searchParams.get('telemetry') === 'true' && CONFIG.isDev;
    
    console.log(`${CONFIG.logPrefix} Fetching airports data with query: "${query}", limit: ${limit}`);
    
    // Check if we should use fallbacks before even trying the database
    if (!CONFIG.useFallbacks && url.searchParams.get('forceFallback') !== 'true') {
      console.log(`${CONFIG.logPrefix} Fallbacks disabled by configuration`);
    }
    
    // If forceFallback is set (for testing), skip DB query
    if (url.searchParams.get('forceFallback') === 'true' && CONFIG.isDev) {
      if (CONFIG.trackTelemetry) {
        telemetry.trackFallback('forced via query parameter');
      }
      
      const filteredFallbacks = query && query.length > 1
        ? filterFallbackData(query, limit)
        : fallbackAirports.slice(0, limit);
      
      return createResponse(filteredFallbacks, includeTelemetry);
    }
    
    // Normal database query flow
    const supabase = await createClient();
    
    // FIXED: Only query columns that exist in the database
    // Query all fields from the airports table except id
    let airportsQuery = supabase
      .from('airports')
      .select('code, name, city, country');
    
    // If query parameter exists, filter results
    if (query && query.length > 1) {
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
      
      // If fallbacks are disabled, return the error
      if (!CONFIG.useFallbacks) {
        return NextResponse.json(
          { error: error.message, code: error.code || 'UNKNOWN' }, 
          { status: 500 }
        );
      }
      
      // Otherwise, use fallback data
      if (CONFIG.trackTelemetry) {
        telemetry.trackFallback('database query error');
      }
      
      const filteredFallbacks = query && query.length > 1
        ? filterFallbackData(query, limit)
        : fallbackAirports.slice(0, limit);
      
      return createResponse(filteredFallbacks, includeTelemetry);
    }
    
    // If no airports were returned from database, use the fallback data
    if (!airports || airports.length === 0) {
      console.log(`${CONFIG.logPrefix} Database returned no results`);
      
      // If fallbacks are disabled, return an empty array
      if (!CONFIG.useFallbacks) {
        return createResponse([], includeTelemetry);
      }
      
      // Otherwise, use fallback data
      if (CONFIG.trackTelemetry) {
        telemetry.trackFallback('empty database results');
      }
      
      const filteredFallbacks = query && query.length > 1
        ? filterFallbackData(query, limit)
        : fallbackAirports.slice(0, limit);
      
      return createResponse(filteredFallbacks, includeTelemetry);
    }
    
    // ADDED: Enhance airport data with geo coordinates for UI enhancements if needed
    // This is done by looking up IATA codes in our fallback data which has coordinates
    const enhancedAirports = airports.map(dbAirport => {
      // Start with the database data
      const airport: Airport = { ...dbAirport };
      
      // Find if we have geo coordinates for this airport code in our fallback data
      const fallbackMatch = fallbackAirports.find(f => f.code === airport.code);
      if (fallbackMatch) {
        // Add geo data from fallback if available
        if (fallbackMatch.lat) airport.lat = fallbackMatch.lat;
        if (fallbackMatch.lng) airport.lng = fallbackMatch.lng;
        if (fallbackMatch.is_private) airport.is_private = fallbackMatch.is_private;
      }
      
      return airport;
    });
    
    // Return the database results with enhancements
    console.log(`${CONFIG.logPrefix} Retrieved ${enhancedAirports.length} airports from database for query "${query}"`);
    return createResponse(enhancedAirports, includeTelemetry);
    
  } catch (error) {
    if (CONFIG.trackTelemetry) {
      telemetry.trackError('unexpected', error);
    }
    
    console.error(`${CONFIG.logPrefix} Unexpected error:`, error);
    
    // If fallbacks are disabled, return the error
    if (!CONFIG.useFallbacks) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error', code: 'UNEXPECTED' }, 
        { status: 500 }
      );
    }
    
    // Otherwise, use fallback data
    if (CONFIG.trackTelemetry) {
      telemetry.trackFallback('unexpected error');
    }
    
    return createResponse(fallbackAirports.slice(0, 100), false);
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
        isFallback: data === fallbackAirports || data.some(a => fallbackAirports.some(f => f.code === a.code)),
        telemetry: telemetry.getStats(),
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return NextResponse.json(data);
} 