import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { addDays, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch completed offers for this user
    const { data: offers, error } = await supabase
      .from('jetshare_offers')
      .select(`
        id,
        status,
        departure_location,
        arrival_location,
        flight_date,
        flight_number,
        matched_user_id,
        requested_seats,
        user:user_id (id, email, full_name),
        jet:jet_id (id, model, registration_number, image_url)
      `)
      .or(`matched_user_id.eq.${userId},user_id.eq.${userId}`)
      .in('status', ['completed', 'paid'])
      .order('flight_date', { ascending: true });
      
    if (error) {
      console.error('Error fetching boarding passes:', error);
      return NextResponse.json({ error: 'Failed to fetch boarding passes' }, { status: 500 });
    }
    
    // If no completed offers are found but we're in development mode, return sample data
    if ((!offers || offers.length === 0) && process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Returning sample boarding passes');
      
      const now = new Date();
      
      // Create sample boarding passes
      const samplePasses = [
        {
          id: 'sample-pass-1',
          offerId: 'sample-offer-1',
          flightNumber: 'GDY123',
          departureLocation: 'New York (NYC)',
          arrivalLocation: 'Miami (MIA)',
          departureTime: addDays(now, 14).toISOString(),
          arrivalTime: addDays(now, 14).toISOString(),
          seatNumber: '1A',
          passengerName: 'Sample User',
          jetModel: 'Gulfstream G650',
          hostId: 'sample-host-1',
          hostName: 'Flight Host',
          hostNip05: 'host@gdyup.xyz'
        },
        {
          id: 'sample-pass-2',
          offerId: 'sample-offer-2',
          flightNumber: 'GDY456',
          departureLocation: 'Los Angeles (LAX)',
          arrivalLocation: 'Las Vegas (LAS)',
          departureTime: addDays(now, 7).toISOString(),
          arrivalTime: addDays(now, 7).toISOString(),
          seatNumber: '2B',
          passengerName: 'Sample User',
          jetModel: 'Citation X',
          hostId: 'sample-host-2',
          hostName: 'Flight Host',
          hostNip05: 'host@gdyup.xyz'
        },
        {
          id: 'sample-pass-3',
          offerId: 'sample-offer-3',
          flightNumber: 'GDY789',
          departureLocation: 'Chicago (ORD)',
          arrivalLocation: 'Denver (DEN)',
          departureTime: subDays(now, 14).toISOString(),
          arrivalTime: subDays(now, 14).toISOString(),
          seatNumber: '3C',
          passengerName: 'Sample User',
          jetModel: 'Phenom 300',
          hostId: 'sample-host-3',
          hostName: 'Flight Host',
          hostNip05: 'host@gdyup.xyz'
        }
      ];
      
      return NextResponse.json({
        success: true,
        boardingPasses: samplePasses
      });
    }
    
    // Transform offers into boarding passes
    const boardingPasses = offers.map(offer => {
      // Note: TypeScript is showing errors because it can't infer the nested structure
      // from the Supabase query. Properly type this in a production app.
      const user = (offer.user as any) || {};
      const jet = (offer.jet as any) || {};
      
      const isPassenger = offer.matched_user_id === userId;
      const hostId = isPassenger ? user.id : null;
      const hostName = isPassenger ? user.full_name : null;
      
      // For real implementation, you would fetch the actual boarding pass data from a dedicated table
      return {
        id: `bp-${offer.id}`,
        offerId: offer.id,
        flightNumber: offer.flight_number || `GDY${offer.id.substring(0, 4).toUpperCase()}`,
        departureLocation: offer.departure_location,
        arrivalLocation: offer.arrival_location,
        departureTime: offer.flight_date,
        seatNumber: isPassenger ? (offer.requested_seats > 1 ? 'Multiple' : '1A') : 'Host',
        passengerName: isPassenger ? 'You (Passenger)' : 'You (Host)',
        jetModel: jet.model || 'Private Jet',
        hostId: hostId,
        hostName: hostName,
        hostNip05: hostId ? `${hostId.substring(0, 8)}@gdyup.xyz` : null
      };
    });
    
    return NextResponse.json({
      success: true,
      boardingPasses: boardingPasses
    });
  } catch (error) {
    console.error('Error in boardingpasses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 