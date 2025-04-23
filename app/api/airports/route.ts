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
    // Always set proper headers to ensure consistent JSON response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
    
    // For the beta launch, use the reliable embedded data instead of database
    console.log(`${CONFIG.logPrefix} Using embedded airport data for reliable beta launch`);
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const codesParam = url.searchParams.get('codes') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Parse codes parameter (comma-separated list of airport codes)
    const codes = codesParam ? codesParam.split(',').map(c => c.trim().toUpperCase()) : [];
    
    let filteredData = fallbackAirports;
    
    // Filter by codes if provided
    if (codes.length > 0) {
      filteredData = fallbackAirports.filter(airport => 
        codes.includes(airport.code)
      );
    } 
    // Or filter by query text
    else if (query && query.length > 1) {
      filteredData = filterFallbackData(query, 100);
    }
    
    // Apply limit
    const limitedData = filteredData.slice(0, limit);
    
    // Return the embedded data directly - no database lookups
    return NextResponse.json(limitedData, { headers });
  } catch (error) {
    console.error(`${CONFIG.logPrefix} Unexpected error:`, error);
    
    // Always return a valid JSON response even on errors
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
    
    // Return all fallback data
    return NextResponse.json(fallbackAirports, { headers });
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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  };
  
  if (includeTelemetry) {
    return NextResponse.json({
      data,
      _meta: {
        source: "database",
        count: data.length,
        telemetry: telemetry.getStats(),
        timestamp: new Date().toISOString()
      }
    }, { headers });
  }
  
  return NextResponse.json(data, { headers });
} 