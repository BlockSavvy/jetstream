import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { add, format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    console.log("Starting find-jetshare-offer function...");
    const { 
      desired_location, 
      date_range, 
      price_range,
      time_of_day,
      user_id,
      matched_flights // This can be passed from the frontend if available
    } = await req.json();

    console.log("Search parameters:", { 
      desired_location, 
      date_range, 
      price_range,
      time_of_day,
      user_id,
      matched_flights_count: matched_flights?.length || 0
    });

    let flights = [];

    // If matched flights are already provided from the frontend
    if (matched_flights && matched_flights.length > 0) {
      console.log(`Using ${matched_flights.length} pre-matched flights from frontend`);
      flights = matched_flights;
    } else {
      // Otherwise, search in the database
      console.log("No pre-matched flights provided, searching database directly");
      const supabase = createClient();
      
      // Build the query with filters
      let query = supabase
        .from('jetshare_offers')
        .select('*')
        .eq('status', 'open')
        .order('flight_date', { ascending: true });
      
      // Apply location filter if provided
      if (desired_location) {
        console.log(`Searching for location: "${desired_location}"`);
        // Note: We need to use departure_location and arrival_location, not departure/arrival
        query = query.or(`departure_location.ilike.%${desired_location}%,arrival_location.ilike.%${desired_location}%`);
      }

      // Apply date range filter if provided
      if (date_range) {
        console.log(`Applying date filter: "${date_range}"`);
        // Simplistic handling - could be improved with proper date parsing
        const today = new Date();
        query = query.gte('flight_date', today.toISOString());
        
        // If we can extract a max date from date_range, use it
        // This is a simplified approach - a more robust date parser would be better
        if (date_range.includes('weekend')) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          query = query.lte('flight_date', nextWeek.toISOString());
        } else if (date_range.includes('month')) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          query = query.lte('flight_date', nextMonth.toISOString());
        } else if (date_range.includes('week')) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          query = query.lte('flight_date', nextWeek.toISOString());
        }
      }

      // Apply time of day filter if provided
      if (time_of_day) {
        console.log(`Applying time of day filter: "${time_of_day}"`);
        // Make sure the query includes departure_time filter
        
        // Only apply time filter if we have departure_time column
        if (time_of_day.includes('morning')) {
          // Morning: 6am-12pm
          query = query.gte('departure_time', format(new Date().setHours(6, 0, 0, 0), "yyyy-MM-dd'T'HH:mm:ss'Z'"))
                       .lte('departure_time', format(new Date().setHours(11, 59, 59, 999), "yyyy-MM-dd'T'HH:mm:ss'Z'"));
        } else if (time_of_day.includes('afternoon')) {
          // Afternoon: 12pm-5pm
          query = query.gte('departure_time', format(new Date().setHours(12, 0, 0, 0), "yyyy-MM-dd'T'HH:mm:ss'Z'"))
                       .lte('departure_time', format(new Date().setHours(16, 59, 59, 999), "yyyy-MM-dd'T'HH:mm:ss'Z'"));
        } else if (time_of_day.includes('evening')) {
          // Evening: 5pm-9pm
          query = query.gte('departure_time', format(new Date().setHours(17, 0, 0, 0), "yyyy-MM-dd'T'HH:mm:ss'Z'"))
                       .lte('departure_time', format(new Date().setHours(20, 59, 59, 999), "yyyy-MM-dd'T'HH:mm:ss'Z'"));
        } else if (time_of_day.includes('night')) {
          // Night: 9pm-6am
          query = query.or(
            `departure_time.gte.${format(new Date().setHours(21, 0, 0, 0), "yyyy-MM-dd'T'HH:mm:ss'Z'")},` +
            `departure_time.lte.${format(new Date().setHours(5, 59, 59, 999), "yyyy-MM-dd'T'HH:mm:ss'Z'")}`
          );
        }
      }

      // Apply price range filter if provided
      if (price_range) {
        console.log(`Applying price filter: "${price_range}"`);
        // Extract max price from price range string if possible
        const priceMatch = price_range.match(/\d+/g);
        if (priceMatch && priceMatch.length > 0) {
          const maxPrice = parseInt(priceMatch[0]);
          if (!isNaN(maxPrice)) {
            // Note: We use total_flight_cost, not total_cost
            query = query.lte('total_flight_cost', maxPrice);
          }
        }
      }

      console.log("Executing database query for flights...");
      const { data, error } = await query.limit(10);
      
      if (error) {
        console.error('Error searching for JetShare offers:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to search for JetShare offers' 
        }, { status: 500 });
      }
      
      console.log(`Query returned ${data?.length || 0} flights`);
      flights = data || [];
    }

    console.log(`Formatting ${flights.length} flights for response`);
    
    // Format flights for response - ensure we're using the correct field names
    const formattedFlights = flights.map((flight: any) => {
      // Map field names correctly from database (departure_location instead of departure)
      // Handle both field naming conventions for compatibility
      const departureTime = flight.departure_time || flight.flight_date;
      
      // Format the departure time to a user-friendly string
      const formattedTime = departureTime ? 
        new Date(departureTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : 'Not specified';
      
      return {
        id: flight.id,
        departure: flight.departure_location || flight.departure,
        arrival: flight.arrival_location || flight.arrival,
        flight_date: flight.flight_date,
        departure_time: departureTime,
        formatted_date: new Date(flight.flight_date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        formatted_time: formattedTime,
        jet_type: flight.aircraft_model || flight.jet_type || 'Not specified',
        total_cost: flight.total_flight_cost || flight.total_cost,
        formatted_cost: (flight.total_flight_cost || flight.total_cost) ? 
          new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(flight.total_flight_cost || flight.total_cost) : 
          'Not specified',
        share_amount: flight.share_amount || flight.requested_share_amount || 
          (flight.available_seats ? `${flight.available_seats} seats` : 'Not specified'),
        user_id: flight.user_id,
        is_users_offer: flight.user_id === user_id
      };
    });

    // Prepare search summary for AI
    let searchSummary = `Found ${formattedFlights.length} JetShare offers`;
    
    if (desired_location) {
      searchSummary += ` related to ${desired_location}`;
    }
    
    if (date_range) {
      searchSummary += ` for ${date_range}`;
    }
    
    if (time_of_day) {
      searchSummary += ` in the ${time_of_day}`;
    }
    
    if (price_range) {
      searchSummary += ` with price range of ${price_range}`;
    }

    console.log(`Returning ${formattedFlights.length} formatted flights`);
    
    if (formattedFlights.length > 0) {
      console.log("Sample flight data:", formattedFlights[0]);
    }

    return NextResponse.json({
      success: true,
      search_summary: searchSummary,
      offers: formattedFlights,
      count: formattedFlights.length,
      search_criteria: {
        desired_location,
        date_range,
        time_of_day,
        price_range
      }
    });
  } catch (error) {
    console.error('Error processing JetShare search:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process JetShare search request' 
    }, { status: 500 });
  }
} 