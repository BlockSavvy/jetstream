import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { addDays, subDays } from 'date-fns';

// Define activity type interface
interface ActivityTypeInfo {
  title: string;
  description: string;
}

// Define valid activity types
type ActivityType = 
  | 'boarding_pass_downloaded'
  | 'wallet_pass_downloaded'
  | 'nostr_connected'
  | 'flight_booked'
  | 'payment_sent'
  | 'payment_received'
  | 'offer_accepted'
  | 'offer_created';

/**
 * GET handler for activity feed
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch activity for the user
    // In a real implementation, you would fetch from a dedicated activity table
    const { data, error } = await supabase
      .from('gdyup_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching activity:', error);
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }
    
    // If no activity data or in development mode, return sample data
    if ((!data || data.length === 0) && process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Returning sample activity');
      
      const now = new Date();
      
      const sampleActivity = [
        {
          id: 'activity-1',
          type: 'flight_booked',
          title: 'Flight Booked',
          description: 'You booked a flight from New York to Miami',
          created_at: now.toISOString(),
          metadata: {
            flightId: 'sample-flight-1',
            departure: 'New York (NYC)',
            arrival: 'Miami (MIA)',
            date: addDays(now, 14).toISOString()
          }
        },
        {
          id: 'activity-2',
          type: 'boarding_pass_downloaded',
          title: 'Boarding Pass Downloaded',
          description: 'You downloaded your boarding pass',
          created_at: subDays(now, 1).toISOString(),
          metadata: {
            boardingPassId: 'sample-pass-1',
            flightNumber: 'GDY123'
          }
        },
        {
          id: 'activity-3',
          type: 'payment_received',
          title: 'Payment Received',
          description: 'You received a payment of 0.01 BTC',
          created_at: subDays(now, 3).toISOString(),
          metadata: {
            amount: '0.01',
            currency: 'BTC',
            transactionId: 'sample-tx-1'
          }
        },
        {
          id: 'activity-4',
          type: 'nostr_connected',
          title: 'Nostr Identity Connected',
          description: 'You connected your Nostr identity',
          created_at: subDays(now, 5).toISOString(),
          metadata: {
            pubkey: '7f3b335850f7d12cd2e7f8f2b671b943e3cb3001e0fca2994411398534e9454a'
          }
        },
        {
          id: 'activity-5',
          type: 'offer_accepted',
          title: 'Offer Accepted',
          description: 'Your offer for a flight was accepted',
          created_at: subDays(now, 7).toISOString(),
          metadata: {
            offerId: 'sample-offer-1',
            flightNumber: 'GDY456'
          }
        }
      ];
      
      return NextResponse.json({
        success: true,
        activity: sampleActivity
      });
    }
    
    return NextResponse.json({
      success: true,
      activity: data || []
    });
  } catch (error) {
    console.error('Error in activity API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for recording new activity
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { type, metadata, userId } = body;
    
    // Basic validation
    if (!type) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
    }
    
    // Default titles and descriptions based on activity type
    const activityTypes: Record<ActivityType, ActivityTypeInfo> = {
      'boarding_pass_downloaded': {
        title: 'Boarding Pass Downloaded',
        description: 'You downloaded your boarding pass'
      },
      'wallet_pass_downloaded': {
        title: 'Wallet Pass Downloaded',
        description: 'You added a boarding pass to your wallet'
      },
      'nostr_connected': {
        title: 'Nostr Identity Connected',
        description: 'You connected your Nostr identity'
      },
      'flight_booked': {
        title: 'Flight Booked',
        description: 'You booked a flight'
      },
      'payment_sent': {
        title: 'Payment Sent',
        description: 'You sent a payment'
      },
      'payment_received': {
        title: 'Payment Received',
        description: 'You received a payment'
      },
      'offer_accepted': {
        title: 'Offer Accepted',
        description: 'Your offer was accepted'
      },
      'offer_created': {
        title: 'Offer Created',
        description: 'You created a new flight offer'
      }
    };
    
    // Use default title/description or custom ones from request
    const activityType = activityTypes[type as ActivityType];
    const title = body.title || (activityType?.title || 'Activity Recorded');
    const description = body.description || (activityType?.description || 'New activity recorded');
    
    // Get user ID from request or from auth
    let userIdToUse = userId;
    
    if (!userIdToUse) {
      // Get user from auth if not provided in request
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      
      userIdToUse = user.id;
    }
    
    // Create the activity record
    const activityRecord = {
      user_id: userIdToUse,
      type,
      title,
      description,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
    
    // Insert into database
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase
      .from('gdyup_activity')
      .insert([activityRecord])
      .select();
    
    if (error) {
      console.error('Error recording activity:', error);
      // If in development and table doesn't exist, just return success
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ 
          success: true,
          message: 'Activity simulated (no table available)',
          activity: activityRecord
        });
      }
      return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      activity: data[0] || activityRecord
    });
  } catch (error) {
    console.error('Error in activity API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 