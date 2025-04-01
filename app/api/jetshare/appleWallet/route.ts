import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// In a production environment, this would generate a proper .pkpass file
// For this demo, we'll return a JSON structure representing what would be in the wallet pass
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
    
    // Generate flight details - similar to the mockBoardingPass endpoint
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
    let departureTimestamp = tomorrow.getTime();
    let boardingTimestamp = tomorrow.getTime() - 3600000; // 1 hour before departure
    
    // If not a test mode, get real data
    if (!isTestMode) {
      try {
        // Check if it's a transaction ID or offer ID
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
          departureTimestamp = flightDate.getTime();
          
          const boardingDateTime = new Date(flightDate.getTime() - 3600000); // 1 hour before
          boardingTime = boardingDateTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
          });
          boardingTimestamp = boardingDateTime.getTime();
          
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
    
    // Generate a simulated Apple Wallet pass in JSON format
    // In a production app, you would use a library like 'passkit-generator' to create a real .pkpass file
    const walletPass = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.jetstream.boardingpass",
      serialNumber: `JSBP-${id.substring(0, 8)}-${Date.now().toString().substring(0, 6)}`,
      teamIdentifier: "JETSTREAM1",
      organizationName: "JetStream Private Jet",
      description: `Boarding pass for flight ${flightNumber}`,
      logoText: "JetStream",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(46, 102, 178)",
      boardingPass: {
        headerFields: [
          {
            key: "gate",
            label: "GATE",
            value: gate,
            changeMessage: "Gate changed to %@"
          }
        ],
        primaryFields: [
          {
            key: "departure",
            label: "FROM",
            value: departureLocation.split(' ')[0],
            changeMessage: "Departure changed to %@"
          },
          {
            key: "arrival",
            label: "TO",
            value: arrivalLocation.split(' ')[0],
            changeMessage: "Arrival changed to %@"
          }
        ],
        secondaryFields: [
          {
            key: "passenger",
            label: "PASSENGER",
            value: passengerName
          },
          {
            key: "flightNumber",
            label: "FLIGHT",
            value: flightNumber
          }
        ],
        auxiliaryFields: [
          {
            key: "boardingTime",
            label: "BOARDING",
            value: boardingTime,
            dateStyle: "PKDateStyleNone",
            timeStyle: "PKTimeStyleShort"
          },
          {
            key: "departureTime",
            label: "DEPARTURE",
            value: departureTime,
            dateStyle: "PKDateStyleNone",
            timeStyle: "PKTimeStyleShort"
          },
          {
            key: "seat",
            label: "SEAT",
            value: seat,
            changeMessage: "Seat changed to %@"
          }
        ],
        backFields: [
          {
            key: "flightInfo",
            label: "FLIGHT",
            value: `${flightNumber} from ${departureLocation} to ${arrivalLocation}`
          },
          {
            key: "departureDate",
            label: "DATE",
            value: departureDate
          },
          {
            key: "passengerInfo",
            label: "PASSENGER",
            value: passengerName
          },
          {
            key: "instructions",
            label: "INSTRUCTIONS",
            value: "Please arrive at the private terminal 1 hour before departure. Present this boarding pass and a valid ID at security."
          },
          {
            key: "additionalInfo",
            label: "ADDITIONAL INFO",
            value: isTestMode ? "TEST MODE - This is a demonstration boarding pass" : "Thank you for flying with JetStream!"
          }
        ],
        transitType: "PKTransitTypeAir"
      },
      barcode: {
        message: `JSBP-${id}-${Date.now().toString().substring(0, 6)}`,
        format: "PKBarcodeFormatQR",
        messageEncoding: "utf-8"
      },
      relevantDate: new Date(departureTimestamp).toISOString(),
      locations: [
        {
          latitude: 40.6413,
          longitude: -73.7781,
          relevantText: "JFK: Your flight is departing soon"
        }
      ],
      barcodes: [
        {
          message: `JSBP-${id}-${Date.now().toString().substring(0, 6)}`,
          format: "PKBarcodeFormatQR",
          messageEncoding: "utf-8"
        }
      ],
      // In a real implementation, these would be proper URLs to images
      // For this demo, we'll use placeholder values
      logoImage: "logo.png",
      icon: "icon.png",
      thumbnail: "thumbnail.png"
    };
    
    // Return the simulated wallet pass JSON
    // In production, this would be a proper .pkpass file with correct MIME type
    return NextResponse.json({
      success: true,
      message: "Apple Wallet pass generated (simulated)",
      // For a demo, we're just returning a representation of what the pass would contain
      // In a real app, this endpoint would serve a proper .pkpass file
      // with Content-Type: application/vnd.apple.pkpass
      walletPass,
      // For testing, include a demonstration URL that would be used in production
      // (this URL doesn't actually work in this demo)
      appleWalletUrl: `https://jetstream.aiya.sh/pass/${id}`,
      // Include UI instructions
      uiInstructions: "In a production environment, users would see an 'Add to Apple Wallet' button that downloads a .pkpass file.",
      testOnly: isTestMode
    });
    
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    return NextResponse.json(
      { error: 'Failed to generate Apple Wallet pass', message: (error as Error).message },
      { status: 500 }
    );
  }
} 