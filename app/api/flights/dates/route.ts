import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface FlightDateInfo {
  date: string;
  flights_count: number;
  total_available_seats: number;
}

interface FlightDateMap {
  [date: string]: FlightDateInfo;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    // Validate month and year if provided
    let startDate, endDate;
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (monthNum < 1 || monthNum > 12 || isNaN(yearNum)) {
        return NextResponse.json(
          { error: 'Invalid month or year provided' },
          { status: 400 }
        );
      }
      
      // Set start and end date for the query based on month and year
      startDate = new Date(yearNum, monthNum - 1, 1).toISOString();
      // Last day of month: Set to first day of next month, then subtract 1 millisecond
      endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999).toISOString();
    } else {
      // Default to the next 3 months if no month/year specified
      startDate = new Date().toISOString();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      endDate = threeMonthsLater.toISOString();
    }

    console.log(`Fetching flights between ${startDate} and ${endDate}`);
    
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('flights')
      .select('departure_time, available_seats')
      .gte('departure_time', startDate)
      .lte('departure_time', endDate)
      .gt('available_seats', 0)
      .eq('status', 'scheduled');
    
    // Apply additional filters if provided
    if (origin) {
      query = query.eq('origin_airport', origin);
    }
    
    if (destination) {
      query = query.eq('destination_airport', destination);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching flight dates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flight dates', details: error.message },
        { status: 500 }
      );
    }
    
    // Group flights by date and count availability
    const flightDates: FlightDateMap = {};
    
    data?.forEach(flight => {
      const date = new Date(flight.departure_time).toISOString().split('T')[0];
      
      if (!flightDates[date]) {
        flightDates[date] = {
          date,
          flights_count: 0,
          total_available_seats: 0
        };
      }
      
      flightDates[date].flights_count += 1;
      flightDates[date].total_available_seats += flight.available_seats;
    });
    
    // Convert to array for easier consumption
    const results = Object.values(flightDates);
    
    return NextResponse.json({
      start_date: startDate,
      end_date: endDate,
      dates: results
    });
    
  } catch (err) {
    console.error('Unexpected error in flight dates API:', err);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
} 