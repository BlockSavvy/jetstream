import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Add an interface for the airport structure
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Interface for the flight with origin
interface FlightWithOrigin {
  origin: any; // Use any for initial parsing then we'll check the structure
}

// Fallback airport data in case the database query returns no results
const fallbackAirports: Airport[] = [
  { code: "EDDB", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany" },
  { code: "OMDB", name: "Dubai International Airport", city: "Dubai", country: "UAE" },
  { code: "VHHH", name: "Hong Kong International Airport", city: "Hong Kong", country: "China" },
  { code: "KLAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "USA" },
  { code: "EGLL", name: "London Heathrow Airport", city: "London", country: "UK" },
  { code: "EGGW", name: "London Luton Airport", city: "London", country: "UK" },
  { code: "KVAN", name: "Van Nuys Airport", city: "Los Angeles", country: "USA" },
  { code: "KLAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA" },
  { code: "KMIA", name: "Miami International Airport", city: "Miami", country: "USA" },
  { code: "EDDM", name: "Munich Airport", city: "Munich", country: "Germany" },
  { code: "VIDP", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India" },
  { code: "KJFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA" },
  { code: "KPBI", name: "Palm Beach International Airport", city: "Palm Beach", country: "USA" },
  { code: "LFPB", name: "Paris–Le Bourget Airport", city: "Paris", country: "France" },
  { code: "KSFO", name: "San Francisco International Airport", city: "San Francisco", country: "USA" },
  { code: "KSDL", name: "Scottsdale Airport", city: "Scottsdale", country: "USA" },
  { code: "YSSY", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia" },
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro", country: "USA" },
  { code: "RJTT", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan" },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains", country: "USA" }
];

export async function GET() {
  try {
    console.log('Fetching airports data...');
    const supabase = await createClient();
    
    // Fetch airports data
    const { data: airports, error } = await supabase
      .from('airports')
      .select('code, name, city, country')
      .order('city');
    
    if (error) {
      console.error('Error fetching airports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the results of the query
    console.log(`Retrieved ${airports?.length || 0} airports from database`);
    
    // If no airports were returned, use the fallback data
    if (!airports || airports.length === 0) {
      console.log('Using fallback airport data since database returned no results');
      return NextResponse.json(fallbackAirports);
    }
    
    return NextResponse.json(airports);
  } catch (error) {
    console.error('Error in airports API:', error);
    // Return fallback data in case of error
    console.log('Using fallback airport data due to error');
    return NextResponse.json(fallbackAirports);
  }
} 