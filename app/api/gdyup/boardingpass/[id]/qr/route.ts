import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import QRCode from 'qrcode';

/**
 * API route for generating boarding pass QR codes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'standard';
    const background = searchParams.get('background') || 'white';
    
    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Fetch offer data
    const { data: offerData, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `)
      .eq('id', offerId)
      .single();
    
    if (offerError) {
      console.error('Error fetching offer data for QR:', offerError);
      
      // Create a simple fallback QR code with just the ID
      const fallbackData = {
        type: 'gdyup-boarding-pass',
        id: offerId,
        timestamp: new Date().toISOString()
      };
      
      const fallbackQrCode = await QRCode.toDataURL(JSON.stringify(fallbackData), {
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#000000',
          light: background === 'transparent' ? '#FFFFFF00' : background
        },
        width: 300
      });
      
      const fallbackDataUrlParts = fallbackQrCode.split(',');
      const fallbackBuffer = Buffer.from(fallbackDataUrlParts[1], 'base64');
      
      return new NextResponse(fallbackBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline',
          'Cache-Control': 'max-age=3600'
        }
      });
    }
    
    // Fetch the boarding pass data
    const { data: boardingPassData, error: bpError } = await supabase
      .from('boarding_passes')
      .select('*')
      .eq('offer_id', offerId)
      .single();
      
    // Create default boarding pass data if none exists
    const boardingPass = boardingPassData || {
      id: `bp-${offerId.substring(0, 8)}`,
      offer_id: offerId,
      passenger_name: offerData.matched_user?.full_name || 'GDY·UP Passenger',
      seat: '1A',
      ticket_code: `GDYUP-${offerId.substring(0, 6).toUpperCase()}`,
      created_at: new Date().toISOString()
    };
    
    // Generate QR code data
    const qrData = {
      type: type === 'nostr' ? 'gdyup-nostr-boarding' : 'gdyup-standard',
      id: offerId,
      boardingPassId: boardingPass.id,
      timestamp: new Date().toISOString(),
      departureLocation: offerData.departure_location,
      departureCode: offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase(),
      arrivalLocation: offerData.arrival_location,
      arrivalCode: offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase(),
      flightDate: offerData.flight_date,
      flightNumber: offerData.flight_number || `GDY-${offerId.substring(0, 4).toUpperCase()}`,
      seat: boardingPass.seat || 'PREM',
      status: 'confirmed',
      verification: type === 'nostr' ? {
        type: 'nostr',
        pubkey: searchParams.get('pubkey') || '',
        timestamp: Date.now(),
        // In a real implementation, this would include a proper Nostr signature
        signature: `verify-${offerId.substring(0, 8)}-${Date.now()}`
      } : undefined
    };
    
    try {
      // Generate the QR code as a data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#000000',
          light: background === 'transparent' ? '#FFFFFF00' : background
        },
        width: 300
      });
      
      // Convert data URL to buffer
      const dataUrlParts = qrCodeDataUrl.split(',');
      const buffer = Buffer.from(dataUrlParts[1], 'base64');
      
      // Return the QR code
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline',
          'Cache-Control': 'max-age=3600', // Cache for 1 hour
        }
      });
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      
      // Return a simple error QR code
      const errorQrCode = await QRCode.toDataURL('Error generating boarding pass QR code', {
        errorCorrectionLevel: 'L',
        margin: 2,
        color: {
          dark: '#FF0000',
          light: background === 'transparent' ? '#FFFFFF00' : background
        },
        width: 300
      });
      
      const errorDataUrlParts = errorQrCode.split(',');
      const errorBuffer = Buffer.from(errorDataUrlParts[1], 'base64');
      
      return new NextResponse(errorBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline',
          'Cache-Control': 'no-cache'
        }
      });
    }
  } catch (error) {
    console.error('Error handling QR code request:', error);
    
    try {
      // Return a simple error QR code
      const errorQrCode = await QRCode.toDataURL('Error: GDY·UP service unavailable', {
        errorCorrectionLevel: 'L',
        margin: 2,
        color: {
          dark: '#FF0000',
          light: '#FFFFFF'
        },
        width: 300
      });
      
      const errorDataUrlParts = errorQrCode.split(',');
      const errorBuffer = Buffer.from(errorDataUrlParts[1], 'base64');
      
      return new NextResponse(errorBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (finalError) {
      return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
    }
  }
} 