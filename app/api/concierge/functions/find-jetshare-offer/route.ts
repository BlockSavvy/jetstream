import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const {
      desired_location,
      date_range = '',
      price_range = '',
      user_id,
    } = await request.json();

    // Validate required parameters
    if (!desired_location || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters for finding offers'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase
    const supabase = createClient();

    // Start building the query
    let query = supabase
      .from('jetshare_offers')
      .select('*')
      .or(`departure_location.ilike.%${desired_location}%,arrival_location.ilike.%${desired_location}%`)
      .eq('status', 'active');

    // Add date filtering if provided
    if (date_range) {
      // Parse the date range - this is a simplistic approach
      // A more complex implementation would parse natural language date ranges
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (date_range.includes('to') || date_range.includes('-')) {
        // Parse range like "June 15 to June 20" or "2023-06-15 - 2023-06-20"
        const parts = date_range.split(/to|-/).map((part: string) => part.trim());
        if (parts.length >= 2) {
          startDate = new Date(parts[0]);
          endDate = new Date(parts[1]);
        }
      } else {
        // Assume single date like "June 15" or "2023-06-15"
        startDate = new Date(date_range);
        endDate = new Date(date_range);
        // Add a day to make it inclusive
        endDate.setDate(endDate.getDate() + 1);
      }

      // Apply date filter if dates are valid
      if (!isNaN(startDate?.getTime() || 0) && !isNaN(endDate?.getTime() || 0)) {
        query = query
          .gte('departure_date', startDate?.toISOString() || '')
          .lt('departure_date', endDate?.toISOString() || '');
      }
    }

    // Add price filtering if provided
    if (price_range) {
      // Parse the price range - this is a simplistic approach
      // A more complex implementation would parse natural language price ranges
      let minPrice: number | null = null;
      let maxPrice: number | null = null;

      if (price_range.includes('to') || price_range.includes('-')) {
        // Parse range like "$500 to $1000" or "500-1000"
        const parts = price_range.replace(/[$,]/g, '').split(/to|-/).map((part: string) => part.trim());
        if (parts.length >= 2) {
          minPrice = parseFloat(parts[0]);
          maxPrice = parseFloat(parts[1]);
        }
      } else if (price_range.toLowerCase().includes('under') || price_range.toLowerCase().includes('less than')) {
        // Parse "under $1000" or "less than $1000"
        const match = price_range.replace(/[$,]/g, '').match(/\d+/);
        if (match) {
          maxPrice = parseFloat(match[0]);
        }
      } else if (price_range.toLowerCase().includes('over') || price_range.toLowerCase().includes('more than')) {
        // Parse "over $1000" or "more than $1000"
        const match = price_range.replace(/[$,]/g, '').match(/\d+/);
        if (match) {
          minPrice = parseFloat(match[0]);
        }
      } else {
        // Try to parse a single number
        const match = price_range.replace(/[$,]/g, '').match(/\d+/);
        if (match) {
          const price = parseFloat(match[0]);
          minPrice = price * 0.8; // 20% below the target price
          maxPrice = price * 1.2; // 20% above the target price
        }
      }

      // Apply price filters if valid
      if (minPrice !== null && !isNaN(minPrice)) {
        query = query.gte('total_cost', minPrice);
      }
      if (maxPrice !== null && !isNaN(maxPrice)) {
        query = query.lte('total_cost', maxPrice);
      }
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error finding JetShare offers:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to search for JetShare offers'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if we found any offers
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          offers: [],
          count: 0,
          message: 'No matching JetShare offers found'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a notification for this search if we found results
    try {
      await supabase
        .from('concierge_scheduled_tasks')
        .insert({
          user_id,
          task_type: 'offer_notification',
          task_details: {
            search_criteria: {
              location: desired_location,
              date_range,
              price_range
            },
            matched_offers: data.length
          },
          status: 'completed',
          scheduled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
    } catch (notificationError) {
      console.error('Error creating notification record:', notificationError);
      // Continue even if notification creation fails
    }

    // Return the found offers
    return new Response(
      JSON.stringify({
        success: true,
        offers: data,
        count: data.length,
        message: `Found ${data.length} JetShare offers matching your criteria`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-jetshare-offer API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 