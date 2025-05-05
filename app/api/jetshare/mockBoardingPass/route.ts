import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id') || 'no-id';
    const format = searchParams.get('format') || 'html';
    const timestamp = searchParams.get('timestamp') || Date.now().toString();
    
    // Create a mock flight info
    const flightData = {
      id: id,
      flightNumber: 'JS' + id.substring(0, 4).toUpperCase(),
      departureLocation: 'New York (JFK)',
      arrivalLocation: 'Los Angeles (LAX)',
      departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      arrivalTime: new Date(Date.now() + 86400000 + 21600000).toISOString(), // Tomorrow + 6 hours
      passengerName: 'Development User',
      gate: 'A12',
      seat: '1A',
      boardingTime: new Date(Date.now() + 86400000 - 3600000).toISOString(), // 1 hour before departure
      status: 'CONFIRMED',
    };
    
    // Format response based on requested format
    if (format === 'qr') {
      // Return an HTML page with a QR code for Nostr
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>GDY·UP Nostr QR Code</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #111; color: white; text-align: center; padding: 2rem; }
              .container { max-width: 500px; margin: 0 auto; background: #222; padding: 2rem; border-radius: 1rem; }
              .qr-placeholder { width: 300px; height: 300px; background: #333; margin: 2rem auto; display: flex; align-items: center; justify-content: center; }
              h1 { color: #DAFF0D; }
              .info { margin: 1rem 0; text-align: left; background: #333; padding: 1rem; border-radius: 0.5rem; }
              .info p { margin: 0.5rem 0; }
              .label { color: #999; display: inline-block; width: 120px; }
              .note { font-size: 0.8rem; color: #999; margin-top: 2rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>GDY·UP Nostr QR Code</h1>
              <p>This is a development mock of a Nostr QR code for your boarding pass.</p>
              
              <div class="qr-placeholder">
                <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="160" fill="#DAFF0D"/>
                  <path d="M30 30H60V60H30V30Z" fill="black"/>
                  <path d="M70 30H80V40H70V30Z" fill="black"/>
                  <path d="M90 30H130V40H90V30Z" fill="black"/>
                  <path d="M70 50H80V60H70V50Z" fill="black"/>
                  <path d="M90 50H100V60H90V50Z" fill="black"/>
                  <path d="M110 50H130V60H110V50Z" fill="black"/>
                  <path d="M30 70H40V80H30V70Z" fill="black"/>
                  <path d="M50 70H60V80H50V70Z" fill="black"/>
                  <path d="M70 70H100V80H70V70Z" fill="black"/>
                  <path d="M110 70H120V80H110V70Z" fill="black"/>
                  <path d="M30 90H40V100H30V90Z" fill="black"/>
                  <path d="M50 90H60V110H50V90Z" fill="black"/>
                  <path d="M70 90H80V100H70V90Z" fill="black"/>
                  <path d="M90 90H100V110H90V90Z" fill="black"/>
                  <path d="M120 90H130V100H120V90Z" fill="black"/>
                  <path d="M30 110H40V120H30V110Z" fill="black"/>
                  <path d="M70 110H80V120H70V110Z" fill="black"/>
                  <path d="M110 110H130V120H110V110Z" fill="black"/>
                  <path d="M30 130H60V140H30V130Z" fill="black"/>
                  <path d="M70 130H80V140H70V130Z" fill="black"/>
                  <path d="M90 130H100V140H90V130Z" fill="black"/>
                  <path d="M110 130H130V140H110V130Z" fill="black"/>
                  <text x="50" y="85" font-size="7" font-family="monospace" fill="black">GDY·UP</text>
                </svg>
              </div>
              
              <div class="info">
                <p><span class="label">Flight:</span> ${flightData.flightNumber}</p>
                <p><span class="label">From:</span> ${flightData.departureLocation}</p>
                <p><span class="label">To:</span> ${flightData.arrivalLocation}</p>
                <p><span class="label">Date:</span> ${new Date(flightData.departureTime).toLocaleDateString()}</p>
                <p><span class="label">Passenger:</span> ${flightData.passengerName}</p>
                <p><span class="label">Status:</span> ${flightData.status}</p>
              </div>
              
              <p class="note">In a production environment, this would be a real Nostr NIP-07 compatible QR code for decentralized verification of your boarding pass.</p>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    } else if (format === 'wallet') {
      // Return an HTML page simulating an Apple Wallet pass
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>GDY·UP Apple Wallet Pass</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #111; color: white; text-align: center; padding: 2rem; }
              .container { max-width: 500px; margin: 0 auto; background: #222; padding: 2rem; border-radius: 1rem; }
              .wallet-pass { width: 300px; margin: 2rem auto; background: linear-gradient(135deg, #333, #222); padding: 1rem; border-radius: 0.8rem; border: 1px solid #444; }
              .wallet-logo { width: 50px; height: 50px; background: #DAFF0D; border-radius: 10px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; }
              h1 { color: #DAFF0D; }
              .pass-title { color: #DAFF0D; margin-top: 0; }
              .info { margin: 1rem 0; text-align: left; }
              .info p { margin: 0.5rem 0; }
              .barcode { width: 250px; height: 70px; background: #444; margin: 1rem auto; display: flex; align-items: center; justify-content: center; }
              .label { color: #999; font-size: 0.8rem; }
              .value { font-size: 1rem; }
              .note { font-size: 0.8rem; color: #999; margin-top: 2rem; }
              .cols { display: flex; justify-content: space-between; }
              .col { flex: 1; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>GDY·UP Apple Wallet</h1>
              <p>This is a development mock of an Apple Wallet pass for your flight.</p>
              
              <div class="wallet-pass">
                <div class="wallet-logo">
                  <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15L85 85H15L50 15Z" fill="black"/>
                  </svg>
                </div>
                <h2 class="pass-title">BOARDING PASS</h2>
                
                <div class="info">
                  <p>
                    <span class="label">FLIGHT</span><br/>
                    <span class="value">${flightData.flightNumber}</span>
                  </p>
                  
                  <div class="cols">
                    <div class="col">
                      <p>
                        <span class="label">FROM</span><br/>
                        <span class="value">JFK</span>
                      </p>
                    </div>
                    <div class="col">
                      <p>
                        <span class="label">TO</span><br/>
                        <span class="value">LAX</span>
                      </p>
                    </div>
                  </div>
                  
                  <div class="cols">
                    <div class="col">
                      <p>
                        <span class="label">DATE</span><br/>
                        <span class="value">${new Date(flightData.departureTime).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div class="col">
                      <p>
                        <span class="label">SEAT</span><br/>
                        <span class="value">${flightData.seat}</span>
                      </p>
                    </div>
                  </div>
                  
                  <p>
                    <span class="label">PASSENGER</span><br/>
                    <span class="value">${flightData.passengerName}</span>
                  </p>
                </div>
                
                <div class="barcode">
                  <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="5" width="2" height="30" fill="white"/>
                    <rect x="15" y="5" width="1" height="30" fill="white"/>
                    <rect x="20" y="5" width="3" height="30" fill="white"/>
                    <rect x="25" y="5" width="2" height="30" fill="white"/>
                    <rect x="30" y="5" width="1" height="30" fill="white"/>
                    <rect x="35" y="5" width="3" height="30" fill="white"/>
                    <rect x="40" y="5" width="2" height="30" fill="white"/>
                    <rect x="45" y="5" width="1" height="30" fill="white"/>
                    <rect x="50" y="5" width="3" height="30" fill="white"/>
                    <rect x="60" y="5" width="2" height="30" fill="white"/>
                    <rect x="65" y="5" width="4" height="30" fill="white"/>
                    <rect x="72" y="5" width="1" height="30" fill="white"/>
                    <rect x="76" y="5" width="2" height="30" fill="white"/>
                    <rect x="82" y="5" width="3" height="30" fill="white"/>
                    <rect x="90" y="5" width="1" height="30" fill="white"/>
                    <rect x="95" y="5" width="3" height="30" fill="white"/>
                    <rect x="100" y="5" width="2" height="30" fill="white"/>
                    <rect x="105" y="5" width="1" height="30" fill="white"/>
                    <rect x="110" y="5" width="3" height="30" fill="white"/>
                    <rect x="116" y="5" width="2" height="30" fill="white"/>
                    <rect x="120" y="5" width="4" height="30" fill="white"/>
                    <rect x="127" y="5" width="1" height="30" fill="white"/>
                    <rect x="130" y="5" width="2" height="30" fill="white"/>
                    <rect x="136" y="5" width="1" height="30" fill="white"/>
                    <rect x="140" y="5" width="3" height="30" fill="white"/>
                    <rect x="145" y="5" width="2" height="30" fill="white"/>
                    <rect x="150" y="5" width="4" height="30" fill="white"/>
                    <rect x="158" y="5" width="1" height="30" fill="white"/>
                    <rect x="162" y="5" width="3" height="30" fill="white"/>
                    <rect x="169" y="5" width="2" height="30" fill="white"/>
                    <rect x="174" y="5" width="3" height="30" fill="white"/>
                    <rect x="180" y="5" width="1" height="30" fill="white"/>
                    <rect x="185" y="5" width="4" height="30" fill="white"/>
                    <rect x="195" y="5" width="1" height="30" fill="white"/>
                    <rect x="200" y="5" width="2" height="30" fill="white"/>
                    <rect x="205" y="5" width="3" height="30" fill="white"/>
                    <rect x="212" y="5" width="1" height="30" fill="white"/>
                    <rect x="215" y="5" width="2" height="30" fill="white"/>
                    <rect x="220" y="5" width="3" height="30" fill="white"/>
                    <rect x="230" y="5" width="1" height="30" fill="white"/>
                    <rect x="232" y="5" width="2" height="30" fill="white"/>
                    <rect x="238" y="5" width="1" height="30" fill="white"/>
                    <rect x="240" y="5" width="4" height="30" fill="white"/>
                    <rect x="248" y="5" width="2" height="30" fill="white"/>
                    <rect x="252" y="5" width="3" height="30" fill="white"/>
                    <rect x="258" y="5" width="2" height="30" fill="white"/>
                    <rect x="263" y="5" width="1" height="30" fill="white"/>
                    <rect x="268" y="5" width="3" height="30" fill="white"/>
                    <rect x="275" y="5" width="2" height="30" fill="white"/>
                    <rect x="280" y="5" width="4" height="30" fill="white"/>
                  </svg>
                </div>
              </div>
              
              <p class="note">In a production environment, this would generate a real .pkpass file that can be added to Apple Wallet.</p>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    } else {
      // Return a PDF-like boarding pass HTML by default
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>GDY·UP Boarding Pass</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #111; color: black; padding: 0; margin: 0; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 0; }
              .header { background: #DAFF0D; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
              .logo { font-size: 1.5rem; font-weight: bold; }
              .boarding-pass { font-size: 1rem; }
              .flight-info { display: flex; padding: 1.5rem; border-bottom: 1px dashed #ccc; }
              .flight-info .col { flex: 1; }
              .label { font-size: 0.8rem; color: #666; }
              .value { font-size: 1.2rem; font-weight: bold; }
              .locations { display: flex; padding: 2rem 1.5rem; align-items: center; }
              .location { flex: 1; text-align: center; }
              .location-code { font-size: 2rem; font-weight: bold; }
              .location-name { font-size: 1rem; }
              .flight-path { flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 1rem; }
              .flight-path svg { width: 100%; max-width: 200px; }
              .passenger-info { display: flex; padding: 1.5rem; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; }
              .passenger-info .col { flex: 1; }
              .barcode-section { padding: 1.5rem; text-align: center; }
              .barcode { display: inline-block; background: #f5f5f5; padding: 1rem; }
              .footer { padding: 1rem; text-align: center; color: #666; font-size: 0.8rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">GDY·UP</div>
                <div class="boarding-pass">BOARDING PASS</div>
              </div>
              
              <div class="flight-info">
                <div class="col">
                  <div class="label">FLIGHT</div>
                  <div class="value">${flightData.flightNumber}</div>
                </div>
                <div class="col">
                  <div class="label">DATE</div>
                  <div class="value">${new Date(flightData.departureTime).toLocaleDateString()}</div>
                </div>
                <div class="col">
                  <div class="label">DEPARTURE</div>
                  <div class="value">${new Date(flightData.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="col">
                  <div class="label">GATE</div>
                  <div class="value">${flightData.gate}</div>
                </div>
              </div>
              
              <div class="locations">
                <div class="location">
                  <div class="location-code">JFK</div>
                  <div class="location-name">New York</div>
                </div>
                
                <div class="flight-path">
                  <svg viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 15 L190 15" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5" />
                    <path d="M10 15 L190 15" stroke="#333" stroke-width="1.5" />
                    <circle cx="10" cy="15" r="4" fill="#333" />
                    <circle cx="190" cy="15" r="4" fill="#333" />
                    <path d="M100 5 L110 15 L100 25 L90 15 Z" fill="#DAFF0D" />
                  </svg>
                </div>
                
                <div class="location">
                  <div class="location-code">LAX</div>
                  <div class="location-name">Los Angeles</div>
                </div>
              </div>
              
              <div class="passenger-info">
                <div class="col">
                  <div class="label">PASSENGER</div>
                  <div class="value">${flightData.passengerName}</div>
                </div>
                <div class="col">
                  <div class="label">SEAT</div>
                  <div class="value">${flightData.seat}</div>
                </div>
                <div class="col">
                  <div class="label">STATUS</div>
                  <div class="value">${flightData.status}</div>
                </div>
              </div>
              
              <div class="barcode-section">
                <div class="barcode">
                  <svg width="300" height="60" viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="5" width="2" height="50" fill="black"/>
                    <rect x="15" y="5" width="1" height="50" fill="black"/>
                    <rect x="20" y="5" width="3" height="50" fill="black"/>
                    <rect x="25" y="5" width="2" height="50" fill="black"/>
                    <rect x="30" y="5" width="1" height="50" fill="black"/>
                    <rect x="35" y="5" width="3" height="50" fill="black"/>
                    <rect x="40" y="5" width="2" height="50" fill="black"/>
                    <rect x="45" y="5" width="1" height="50" fill="black"/>
                    <rect x="50" y="5" width="3" height="50" fill="black"/>
                    <rect x="60" y="5" width="2" height="50" fill="black"/>
                    <rect x="65" y="5" width="4" height="50" fill="black"/>
                    <rect x="72" y="5" width="1" height="50" fill="black"/>
                    <rect x="76" y="5" width="2" height="50" fill="black"/>
                    <rect x="82" y="5" width="3" height="50" fill="black"/>
                    <rect x="90" y="5" width="1" height="50" fill="black"/>
                    <rect x="95" y="5" width="3" height="50" fill="black"/>
                    <rect x="100" y="5" width="2" height="50" fill="black"/>
                    <rect x="105" y="5" width="1" height="50" fill="black"/>
                    <rect x="110" y="5" width="3" height="50" fill="black"/>
                    <rect x="116" y="5" width="2" height="50" fill="black"/>
                    <rect x="120" y="5" width="4" height="50" fill="black"/>
                    <rect x="127" y="5" width="1" height="50" fill="black"/>
                    <rect x="130" y="5" width="2" height="50" fill="black"/>
                    <rect x="136" y="5" width="1" height="50" fill="black"/>
                    <rect x="140" y="5" width="3" height="50" fill="black"/>
                    <rect x="145" y="5" width="2" height="50" fill="black"/>
                    <rect x="150" y="5" width="4" height="50" fill="black"/>
                    <rect x="158" y="5" width="1" height="50" fill="black"/>
                    <rect x="162" y="5" width="3" height="50" fill="black"/>
                    <rect x="169" y="5" width="2" height="50" fill="black"/>
                    <rect x="174" y="5" width="3" height="50" fill="black"/>
                    <rect x="180" y="5" width="1" height="50" fill="black"/>
                    <rect x="185" y="5" width="4" height="50" fill="black"/>
                    <rect x="195" y="5" width="1" height="50" fill="black"/>
                    <rect x="200" y="5" width="2" height="50" fill="black"/>
                    <rect x="205" y="5" width="3" height="50" fill="black"/>
                    <rect x="212" y="5" width="1" height="50" fill="black"/>
                    <rect x="215" y="5" width="2" height="50" fill="black"/>
                    <rect x="220" y="5" width="3" height="50" fill="black"/>
                    <rect x="230" y="5" width="1" height="50" fill="black"/>
                    <rect x="232" y="5" width="2" height="50" fill="black"/>
                    <rect x="238" y="5" width="1" height="50" fill="black"/>
                    <rect x="240" y="5" width="4" height="50" fill="black"/>
                    <rect x="248" y="5" width="2" height="50" fill="black"/>
                    <rect x="252" y="5" width="3" height="50" fill="black"/>
                    <rect x="258" y="5" width="2" height="50" fill="black"/>
                    <rect x="263" y="5" width="1" height="50" fill="black"/>
                    <rect x="268" y="5" width="3" height="50" fill="black"/>
                    <rect x="275" y="5" width="2" height="50" fill="black"/>
                    <rect x="280" y="5" width="4" height="50" fill="black"/>
                  </svg>
                  <div>${id}-${timestamp}</div>
                </div>
              </div>
              
              <div class="footer">
                <p>DEVELOPMENT MODE: This is a simulated boarding pass for testing purposes only.</p>
              </div>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }
    
  } catch (error) {
    console.error('Error generating mock boarding pass:', error);
    return NextResponse.json(
      { error: 'Failed to generate mock boarding pass', message: (error as Error).message },
      { status: 500 }
    );
  }
} 