import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as passkit from '@walletpass/pass-js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Convert fs methods to Promise-based
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * API endpoint to generate an Apple Wallet pass for a boarding pass
 * 
 * @param req Request with offerId parameter
 * @returns Apple Wallet pass file (.pkpass)
 */
export async function GET(req: NextRequest) {
  try {
    // Extract parameters from the URL
    const url = new URL(req.url);
    const offerId = url.searchParams.get('offer_id');
    
    if (!offerId) {
      return NextResponse.json({ error: 'Missing offer_id parameter' }, { status: 400 });
    }
    
    // Get offer and boarding pass data from Supabase
    const supabase = createClient();
    
    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // Get the boarding pass details
    const { data: ticket, error: ticketError } = await supabase
      .from('jetshare_tickets')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Create a temp directory for pass files if it doesn't exist
    const tempDir = path.resolve('/tmp/passkit');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (err) {
      // Ignore if directory already exists
    }
    
    // Certificate paths - in a real app, these would be securely stored
    // For this example, we'll use mock data and settings
    const mockMode = true;
    
    if (mockMode) {
      // In mock mode, we'll return a pre-generated pass file
      const mockPassData = await generateMockPass(offer, ticket);
      
      return new Response(mockPassData, {
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="gdyup-boarding-pass.pkpass"`,
        },
      });
    }
    
    // For real passkit generation, we'd use code like this:
    /*
    // Load certificates
    const certPath = process.env.PASSKIT_CERT_PATH || '';
    const keyPath = process.env.PASSKIT_KEY_PATH || '';
    const wwdrPath = process.env.PASSKIT_WWDR_PATH || '';
    const passTypeId = process.env.PASSKIT_TYPE_ID || '';
    const teamId = process.env.PASSKIT_TEAM_ID || '';
    
    // Create a new pass
    const pass = new passkit.BoadingPass({
      passTypeIdentifier: passTypeId,
      teamIdentifier: teamId,
      organizationName: 'GDY·UP',
      description: 'GDY·UP Boarding Pass',
      serialNumber: ticket ? ticket.ticket_code : `GDY${Math.floor(1000 + Math.random() * 9000)}`,
      foregroundColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(0, 0, 0)',
    });
    
    // Set the pass structure
    pass.setBoardingPass({
      transitType: 'AIR',
      headerFields: [
        {
          key: 'gate',
          label: 'GATE',
          value: ticket ? ticket.gate : 'A1',
        },
      ],
      primaryFields: [
        {
          key: 'origin',
          label: 'FROM',
          value: offer.departure_location,
        },
        {
          key: 'destination',
          label: 'TO',
          value: offer.arrival_location,
        },
      ],
      secondaryFields: [
        {
          key: 'passenger',
          label: 'PASSENGER',
          value: ticket ? ticket.passenger_name : 'GDY·UP Traveler',
        },
        {
          key: 'seat',
          label: 'SEAT',
          value: ticket ? ticket.seat_number : '1A',
        },
      ],
      auxiliaryFields: [
        {
          key: 'date',
          label: 'DATE',
          value: new Date(offer.flight_date).toLocaleDateString(),
        },
        {
          key: 'boardingTime',
          label: 'BOARDING',
          value: new Date(offer.flight_date).toLocaleTimeString(),
        },
      ],
      backFields: [
        {
          key: 'terms',
          label: 'TERMS AND CONDITIONS',
          value: 'This is your boarding pass for your GDY·UP private jet flight.',
        },
      ],
    });
    
    // Add logos and images
    pass.addBuffer('logo.png', await readFile('path/to/logo.png'));
    pass.addBuffer('icon.png', await readFile('path/to/icon.png'));
    
    // Load certificates
    pass.setCertificate(await readFile(certPath));
    pass.setPrivateKey(await readFile(keyPath));
    pass.setWWDR(await readFile(wwdrPath));
    
    // Generate the pass
    const passBuffer = await pass.generate();
    
    // Save the pass to a temp file
    const passPath = path.join(tempDir, `${ticket ? ticket.ticket_code : 'gdyup-boarding-pass'}.pkpass`);
    await writeFile(passPath, passBuffer);
    
    // Return the pass file
    const passData = await readFile(passPath);
    
    return new Response(passData, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${ticket ? ticket.ticket_code : 'gdyup-boarding-pass'}.pkpass"`,
      },
    });
    */
    
    // For now, return a mock pass
    return NextResponse.json({ 
      message: 'Apple Wallet integration coming soon',
      ticket_code: ticket ? ticket.ticket_code : 'MOCK-TICKET',
      flight_details: {
        from: offer.departure_location,
        to: offer.arrival_location,
        date: new Date(offer.flight_date).toLocaleDateString(),
      }
    });
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    return NextResponse.json({ error: 'Failed to generate Apple Wallet pass' }, { status: 500 });
  }
}

/**
 * Generate a mock pass file for testing
 */
async function generateMockPass(offer: any, ticket: any) {
  // In a real implementation, we would use the passkit library to generate a real pass
  // For now, let's return a simple buffer as a placeholder
  const mockPassData = Buffer.from(`
    GDY·UP BOARDING PASS
    
    FROM: ${offer.departure_location}
    TO: ${offer.arrival_location}
    DATE: ${new Date(offer.flight_date).toLocaleDateString()}
    
    PASSENGER: ${ticket ? ticket.passenger_name : 'GDY·UP Traveler'}
    SEAT: ${ticket ? ticket.seat_number : '1A'}
    GATE: ${ticket ? ticket.gate : 'A1'}
    
    TICKET CODE: ${ticket ? ticket.ticket_code : `GDY${Math.floor(1000 + Math.random() * 9000)}`}
  `);
  
  return mockPassData;
} 