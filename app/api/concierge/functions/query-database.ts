import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { add, format, parse, parseISO } from 'date-fns';

export const runtime = 'edge';

interface DateTimeRange {
  start: string;
  end: string;
}

// Parse time-based queries into DateTime ranges
function parseTimeQuery(timeQuery: string): DateTimeRange | null {
  try {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    let startDate, endDate;
    
    // Handle relative date references
    if (timeQuery.includes('tomorrow')) {
      const tomorrow = add(now, { days: 1 });
      startDate = format(tomorrow, 'yyyy-MM-dd');
      endDate = format(add(tomorrow, { days: 1 }), 'yyyy-MM-dd');
    } else if (timeQuery.includes('next week')) {
      const nextWeek = add(now, { weeks: 1 });
      startDate = format(nextWeek, 'yyyy-MM-dd');
      endDate = format(add(nextWeek, { days: 7 }), 'yyyy-MM-dd');
    } else if (timeQuery.includes('weekend')) {
      // Find the next Friday
      let friday = new Date(now);
      friday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
      startDate = format(friday, 'yyyy-MM-dd');
      endDate = format(add(friday, { days: 2 }), 'yyyy-MM-dd');
    } else if (timeQuery.includes('today')) {
      startDate = today;
      endDate = format(add(now, { days: 1 }), 'yyyy-MM-dd');
    } else {
      // Default to next 7 days if no specific time given
      startDate = today;
      endDate = format(add(now, { days: 7 }), 'yyyy-MM-dd');
    }
    
    // Handle time-of-day references
    let startTime = '00:00:00';
    let endTime = '23:59:59';
    
    if (timeQuery.includes('morning')) {
      startTime = '06:00:00';
      endTime = '12:00:00';
    } else if (timeQuery.includes('afternoon')) {
      startTime = '12:00:00';
      endTime = '17:00:00';
    } else if (timeQuery.includes('evening')) {
      startTime = '17:00:00';
      endTime = '21:00:00';
    } else if (timeQuery.includes('night')) {
      startTime = '21:00:00';
      endTime = '06:00:00';
      // For night, adjust the end date to be the next day
      if (endTime < startTime) {
        endDate = format(add(parseISO(endDate), { days: 1 }), 'yyyy-MM-dd');
      }
    }
    
    // Construct full ISO strings
    return {
      start: `${startDate}T${startTime}Z`,
      end: `${endDate}T${endTime}Z`
    };
  } catch (error) {
    console.error('Error parsing time query:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { table_name, query_fields = '*', filters = {}, limit = 10 } = body;
    
    console.log('Database query request:', { table_name, query_fields, filters, limit });
    
    // Validate the table name to prevent SQL injection
    const validTables = ['airports', 'flights', 'jets', 'jetshare_offers', 'profiles'];
    if (!validTables.includes(table_name)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }
    
    // Connect to Supabase
    const supabase = await createClient();
    
    // Start building the query
    let query = supabase
      .from(table_name)
      .select(query_fields);
    
    // Apply filters - special handling for time-based queries
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // Skip null/undefined values
        if (value === null || value === undefined) {
          return;
        }

        // Special handling for JetShare date/time filters
        if (table_name === 'jetshare_offers' && key === 'time_query' && typeof value === 'string') {
          const timeRange = parseTimeQuery(value);
          if (timeRange) {
            // Filter by departure_time for time-based queries
            query = query.gte('departure_time', timeRange.start)
                         .lte('departure_time', timeRange.end);
          }
          return;
        }
        
        // Handle standard comparison operators
        if (typeof value === 'object' && !Array.isArray(value)) {
          const { operator, value: operatorValue } = value as any;
          
          switch (operator) {
            case 'eq':
              query = query.eq(key, operatorValue);
              break;
            case 'neq':
              query = query.neq(key, operatorValue);
              break;
            case 'gt':
              query = query.gt(key, operatorValue);
              break;
            case 'gte':
              query = query.gte(key, operatorValue);
              break;
            case 'lt':
              query = query.lt(key, operatorValue);
              break;
            case 'lte':
              query = query.lte(key, operatorValue);
              break;
            case 'like':
              query = query.ilike(key, `%${operatorValue}%`);
              break;
            default:
              query = query.eq(key, operatorValue);
          }
        } else if (Array.isArray(value)) {
          // Handle array values for "in" operator
          query = query.in(key, value);
        } else if (typeof value === 'string' && 
                   (key === 'departure_location' || key === 'arrival_location' || 
                    key === 'destination' || key === 'origin')) {
          // Use pattern matching for location fields
          query = query.ilike(key, `%${value}%`);
        } else {
          // Default to exact match
          query = query.eq(key, value);
        }
      });
    }
    
    // Add status filter for jetshare_offers if not already specified
    if (table_name === 'jetshare_offers' && !filters.status) {
      query = query.eq('status', 'open');
    }
    
    // Add order for jetshare_offers to get latest first
    if (table_name === 'jetshare_offers') {
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply limit
    query = query.limit(limit || 10);
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in database query function:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 