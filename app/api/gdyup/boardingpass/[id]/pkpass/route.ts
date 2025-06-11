import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { format } from 'date-fns';
import JSZip from 'jszip';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the ID from the path
    const boardingPassId = params.id;
    if (!boardingPassId) {
      return NextResponse.json({ error: 'Boarding pass ID is required' }, { status: 400 });
    }
    
    // Check for transaction ID in query parameters
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch boarding pass data
    let offerData;
    let boardingPassData;
    
    // Attempt to fetch boarding pass data with transaction ID if provided
    if (transactionId) {
      const { data, error } = await supabase
        .from('jetshare_transactions')
        .select(`
          *,
          offer:offer_id(*)
        `)
        .eq('id', transactionId)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      
      // Extract boarding pass data from transaction
      offerData = data.offer;
      boardingPassData = {
        id: boardingPassId,
        passenger_name: data.payer_name || 'Guest',
        seat: data.metadata?.seat || '1A',
        ticket_code: `GDY-${boardingPassId.substring(0, 6).toUpperCase()}`,
        created_at: data.created_at
      };
    } else {
      // If no transaction ID, fetch the offer directly
      const { data, error } = await supabase
        .from('jetshare_offers')
        .select('*')
        .eq('id', boardingPassId)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }
      
      offerData = data;
      
      // Create a generic boarding pass
      boardingPassData = {
        id: boardingPassId,
        passenger_name: 'Guest',
        seat: 'TBD',
        ticket_code: `GDY-${boardingPassId.substring(0, 6).toUpperCase()}`,
        created_at: new Date().toISOString()
      };
    }
    
    // Create a new ZIP (which will become our .pkpass file)
    const zip = new JSZip();
    
    // Generate pass.json for the Apple Wallet pass
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.gdyup.boardingpass",
      teamIdentifier: "GDYUP12345",
      organizationName: "GDY·UP Aviation",
      serialNumber: boardingPassId,
      description: `${offerData.departure_location} to ${offerData.arrival_location}`,
      logoText: "GDY·UP",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(17, 24, 39)",
      labelColor: "rgb(156, 163, 175)",
      boardingPass: {
        transitType: "air",
        headerFields: [
          {
            key: "flight",
            label: "FLIGHT",
            value: boardingPassData.ticket_code
          }
        ],
        primaryFields: [
          {
            key: "origin",
            label: "FROM",
            value: offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase()
          },
          {
            key: "destination",
            label: "TO",
            value: offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase()
          }
        ],
        secondaryFields: [
          {
            key: "passenger",
            label: "PASSENGER",
            value: boardingPassData.passenger_name
          },
          {
            key: "seat",
            label: "SEAT",
            value: boardingPassData.seat
          }
        ],
        auxiliaryFields: [
          {
            key: "boardingTime",
            label: "BOARDING",
            value: format(new Date(offerData.flight_date), 'h:mm a')
          },
          {
            key: "date",
            label: "DATE",
            value: format(new Date(offerData.flight_date), 'MMM d, yyyy')
          }
        ],
        backFields: [
          {
            key: "terms",
            label: "TERMS",
            value: "This boarding pass is for the exclusive use of the passenger named herein. Please arrive at the FBO or private terminal at least 30 minutes before departure."
          },
          {
            key: "bitcoin",
            label: "BITCOIN-ENABLED",
            value: "This boarding pass was issued on the GDY·UP Bitcoin-native flight sharing platform."
          }
        ]
      },
      barcode: {
        message: `GDYUP:${boardingPassId}`,
        format: "PKBarcodeFormatQR",
        messageEncoding: "utf-8"
      },
      generic: {},
      relevantDate: offerData.flight_date,
      expirationDate: new Date(new Date(offerData.flight_date).getTime() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Add pass.json to the ZIP
    zip.file("pass.json", JSON.stringify(passJson, null, 2));
    
    // Normally, we would also:
    // 1. Add manifest.json containing SHA1 hashes of all files
    // 2. Sign the package with a valid Apple Developer certificate
    // 3. Add various required images (icon.png, logo.png, etc.)
    
    // For demo purposes, we'll add placeholder files
    
    // Add a simple manifest (would normally contain SHA1 hashes)
    const manifest = {
      "pass.json": crypto.createHash('sha1').update(JSON.stringify(passJson, null, 2)).digest('hex')
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    
    // Add a dummy signature file (would normally be a PKCS #7 signature)
    zip.file("signature", "This is a placeholder for a real signature.");
    
    // Generate .pkpass as a buffer
    const pkpassBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    // Return the .pkpass file
    return new Response(pkpassBuffer, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="gdyup-boarding-${boardingPassId}.pkpass"`,
      },
    });
  } catch (error) {
    console.error('Error generating Apple Wallet pass:', error);
    return NextResponse.json({ 
      error: 'Failed to generate Apple Wallet pass', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 