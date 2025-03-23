import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Airport interface
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Fallback airport data
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

// Helper function to find airport by code
function findAirportByCode(code: string): Airport | null {
  return fallbackAirports.find(airport => airport.code === code) || null;
}

// Interface that matches the expected structure from Supabase
interface FlightData {
  id: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  base_price: number;
  status: string;
  jet_id: string;
  jets: any;
  origin: any;
  destination: any;
  [key: string]: any;
}

export async function GET() {
  try {
    console.log('Fetching flights data...');
    const supabase = await createClient();
    
    // Fetch flights with related data including complete jet details
    const { data: flights, error } = await supabase
      .from('flights')
      .select(`
        id,
        origin_airport,
        destination_airport,
        departure_time,
        arrival_time,
        available_seats,
        base_price,
        status,
        jet_id,
        jets(
          id,
          manufacturer,
          model,
          tail_number,
          capacity,
          images,
          amenities,
          hourly_rate
        ),
        origin:origin_airport(
          code,
          name,
          city,
          country
        ),
        destination:destination_airport(
          code,
          name,
          city,
          country
        )
      `)
      .limit(50);
    
    if (error) {
      console.error('Error fetching flights:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Fix missing origin and destination with our fallback data
    const enhancedFlights = flights.map((flight: FlightData) => {
      // Create a modified flight object to avoid mutating the original
      const enhancedFlight = { ...flight };
      
      // If origin is null, use fallback data
      if (!enhancedFlight.origin && enhancedFlight.origin_airport) {
        const airportData = findAirportByCode(enhancedFlight.origin_airport);
        // Handle both cases: either assign the airport data or use a fallback
        enhancedFlight.origin = airportData ? airportData : { code: enhancedFlight.origin_airport, city: 'Unknown', name: 'Unknown', country: 'Unknown' };
      }
      
      // If destination is null, use fallback data
      if (!enhancedFlight.destination && enhancedFlight.destination_airport) {
        const airportData = findAirportByCode(enhancedFlight.destination_airport);
        // Handle both cases: either assign the airport data or use a fallback
        enhancedFlight.destination = airportData ? airportData : { code: enhancedFlight.destination_airport, city: 'Unknown', name: 'Unknown', country: 'Unknown' };
      }
      
      return enhancedFlight;
    });
    
    // Log more detailed debug information
    console.log(`Retrieved ${flights?.length || 0} flights`);
    
    // Debug: log first flight details to verify structure
    if (enhancedFlights && enhancedFlights.length > 0) {
      const firstFlight = enhancedFlights[0];
      console.log('First flight enhanced structure:', {
        id: firstFlight.id,
        origin_airport_code: firstFlight.origin_airport,
        destination_airport_code: firstFlight.destination_airport,
        origin: firstFlight.origin,
        destination: firstFlight.destination,
        jets: firstFlight.jets
      });
    }
    
    return NextResponse.json(enhancedFlights);
  } catch (error) {
    console.error('Error in flights API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 