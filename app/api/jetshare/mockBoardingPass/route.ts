import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id') || '';
    const isTestMode = searchParams.get('test') === 'true' || id.startsWith('test-');
    const format = searchParams.get('format') || 'text';
    
    // Default values for boarding pass
    let flightNumber = 'JS1234';
    let departureLocation = 'New York (JFK)';
    let arrivalLocation = 'Los Angeles (LAX)';
    let departureDate = 'Tomorrow';
    let departureTime = '10:00 AM EST';
    let boardingTime = '9:00 AM EST';
    let gate = 'G12';
    let seat = '1A';
    let passengerName = 'TEST PASSENGER';
    
    // For real boarding passes, try to get the actual data
    if (!isTestMode && id) {
      // Get the authenticated user (for production pass)
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      try {
        // Try to find the transaction or offer
        const { data: offerData, error: offerError } = await supabase
          .from('jetshare_offers')
          .select('*')
          .or(`id.eq.${id},transaction_id.eq.${id}`)
          .maybeSingle();
        
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
    
    // Handle QR code format specifically for Nostr
    if (format === 'qr') {
      // Create a simple HTML page with a QR code display for Nostr verification
      const barcodeValue = `nostr:${id}:flight=${flightNumber}:seat=${seat}:time=${Date.now()}`;
      const nostrQRHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nostr Boarding Pass QR Code</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      background-color: #111;
      color: #fff;
    }
    .qr-container {
      margin: 20px auto;
      padding: 20px;
      background-color: white;
      border-radius: 10px;
      max-width: 300px;
    }
    .flight-info {
      margin: 20px 0;
      padding: 20px;
      background-color: #222;
      border-radius: 10px;
      text-align: left;
    }
    .flight-info p {
      margin: 5px 0;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: #aaa;
      margin-bottom: 30px;
    }
    .test-notice {
      color: #ff3e00;
      font-weight: bold;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="title">GDY·UP Private Jet Boarding Pass</div>
  <div class="subtitle">Nostr Verification QR Code</div>
  
  ${isTestMode ? '<div class="test-notice">TEST MODE - NOT A REAL BOARDING PASS</div>' : ''}
  
  <div class="qr-container" id="qrcode"></div>
  
  <div class="flight-info">
    <p><strong>Flight:</strong> ${flightNumber}</p>
    <p><strong>From:</strong> ${departureLocation}</p>
    <p><strong>To:</strong> ${arrivalLocation}</p>
    <p><strong>Date:</strong> ${departureDate}</p>
    <p><strong>Time:</strong> ${departureTime}</p>
    <p><strong>Passenger:</strong> ${passengerName}</p>
    <p><strong>Seat:</strong> ${seat}</p>
    <p><strong>Gate:</strong> ${gate}</p>
    <p><strong>Boarding:</strong> ${boardingTime}</p>
  </div>
  
  <script>
    // Generate QR code
    QRCode.toCanvas(document.getElementById('qrcode'), '${barcodeValue}', {
      width: 250,
      margin: 2,
      color: {
        dark: '#000',
        light: '#FFF'
      }
    }, function(error) {
      if (error) console.error(error);
    });
  </script>
</body>
</html>
      `;

      return new NextResponse(nostrQRHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }
    
    // Generate a simple ASCII boarding pass for text format
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
    console.error('Error generating mock boarding pass:', error);
    return NextResponse.json(
      { error: 'Failed to generate boarding pass', message: (error as Error).message },
      { status: 500 }
    );
  }
} 