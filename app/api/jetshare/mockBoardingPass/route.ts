import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const isTestMode = searchParams.get('test') === 'true' || id?.startsWith('test-');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // For test transactions, we'll bypass auth checks
    if (!isTestMode && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate flight details
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    
    let flightNumber = 'JS1234';
    let departureLocation = 'New York (JFK)';
    let arrivalLocation = 'Los Angeles (LAX)';
    let departureDate = tomorrow.toDateString();
    let departureTime = '10:00 AM EDT';
    let boardingTime = '9:00 AM EDT';
    let gate = 'G12';
    let seat = '1A';
    let passengerName = 'TEST PASSENGER';
    
    // If not a test mode, get real data
    if (!isTestMode) {
      try {
        // Check if it's a transaction ID or offer ID
        let transactionData;
        let offerData;
        
        // First try to find as transaction
        const { data: txData, error: txError } = await supabase
          .from('jetshare_transactions')
          .select(`
            *,
            offer:offer_id(*)
          `)
          .eq('id', id)
          .single();
        
        if (!txError && txData) {
          transactionData = txData;
          offerData = txData.offer;
        } else {
          // Try to find as offer ID
          const { data: ofData, error: ofError } = await supabase
            .from('jetshare_offers')
            .select('*')
            .eq('id', id)
            .single();
          
          if (!ofError && ofData) {
            offerData = ofData;
          }
        }
        
        if (offerData) {
          // Get user profile for name
          let userProfile;
          if (user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', user.id)
              .single();
            
            if (profileData) {
              userProfile = profileData;
            }
          }
          
          // Generate flight details from offer
          const offerIdStr = offerData.id.toString();
          flightNumber = `JS${offerIdStr.substring(offerIdStr.length - 4).toUpperCase()}`;
          departureLocation = offerData.departure_location;
          arrivalLocation = offerData.arrival_location;
          
          const flightDate = new Date(offerData.flight_date);
          departureDate = flightDate.toDateString();
          departureTime = flightDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short' 
          });
          
          const boardingDateTime = new Date(flightDate.getTime() - 3600000); // 1 hour before
          boardingTime = boardingDateTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
          });
          
          // Generate gate & seat from hash of offer ID
          const hash = offerData.id.split('').reduce((a: number, b: string) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          gate = `G${Math.abs(hash % 30) + 1}`;
          const seatRow = Math.abs((hash >> 4) % 20) + 1;
          const seatLetter = String.fromCharCode(65 + Math.abs((hash >> 8) % 6)); // A-F
          seat = `${seatRow}${seatLetter}`;
          
          // Set passenger name
          if (userProfile) {
            passengerName = `${userProfile.first_name.toUpperCase()} ${userProfile.last_name.toUpperCase()}`;
          } else if (user?.email) {
            passengerName = user.email.split('@')[0].toUpperCase();
          }
        }
      } catch (dbError) {
        console.error('Error fetching flight details:', dbError);
        // Continue with default values
      }
    }
    
    // Generate a simple ASCII boarding pass
    const boardingPass = `
JETSTREAM PRIVATE JET BOARDING PASS
==================================
${isTestMode ? '[TEST MODE - NOT A REAL BOARDING PASS]' : 'BOARDING PASS'}

FLIGHT: ${flightNumber}
FROM: ${departureLocation}
TO: ${arrivalLocation}
DATE: ${departureDate}
DEPARTURE: ${departureTime}
BOARDING: ${boardingTime}
GATE: ${gate}
SEAT: ${seat}
PASSENGER: ${passengerName}
STATUS: CONFIRMED

BOARDING PASS ID: JSBP-${id.substring(0, 8)}

${isTestMode ? '[TEST MODE - This is a demonstration boarding pass]' : ''}

INSTRUCTIONS:
1. Please arrive at the private terminal 1 hour before departure
2. Present this boarding pass and a valid ID at security
3. Proceed to the gate at boarding time
4. Enjoy your premium JetStream flight experience

BARCODE: ||||||||||||||||||||||||||||||||
         BP${id}${Date.now().toString().substring(0, 6)}
         ||||||||||||||||||||||||||||||||

Thank you for flying with JetStream!
For support: support@jetstream.aiya.sh
    `;
    
    // Set appropriate headers for plain text download
    const headers = new Headers();
    headers.set('Content-Type', 'text/plain');
    headers.set('Content-Disposition', `attachment; filename="jetshare-boardingpass-${id.substring(0, 8)}.txt"`);
    
    return new NextResponse(boardingPass, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error generating boarding pass:', error);
    return NextResponse.json(
      { error: 'Failed to generate boarding pass', message: (error as Error).message },
      { status: 500 }
    );
  }
} 