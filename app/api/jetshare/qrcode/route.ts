import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase';

/**
 * API endpoint for generating QR codes for boarding passes
 * Supports both standard and Nostr-compatible QR codes
 * 
 * @param req Request with query parameters:
 *   - data: The data to encode in the QR code
 *   - type: 'standard' or 'nostr'
 *   - background: Background color (default: white)
 */
export async function GET(req: NextRequest) {
  try {
    // Extract parameters from the URL
    const url = new URL(req.url);
    const data = url.searchParams.get('data');
    const type = url.searchParams.get('type') || 'standard'; 
    const background = url.searchParams.get('background') || 'white';
    
    // Validate required parameters
    if (!data) {
      return NextResponse.json({ error: 'Missing data parameter' }, { status: 400 });
    }
    
    // QR code options
    const options: QRCode.QRCodeToDataURLOptions = {
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: background === 'transparent' ? '#FFFFFF00' : background
      }
    };
    
    // For Nostr QR codes, we need to sign the data
    if (type === 'nostr') {
      try {
        // Parse the Nostr event data
        const nostrData = JSON.parse(data);
        
        // Add a special prefix to indicate this is a Nostr event
        // In a real implementation, this would involve proper cryptographic signing
        const qrData = `nostr:${JSON.stringify({
          ...nostrData,
          pubkey: process.env.GDYUP_NOSTR_PUBKEY || 'gdyup-placeholder-pubkey',
          created_at: Math.floor(Date.now() / 1000),
          kind: 30311, // Custom event kind for boarding passes
          tags: [
            ['d', nostrData.ticket_code || nostrData.id],
            ['t', 'gdyup-boarding-pass'],
            ['expiration', Math.floor(Date.now() / 1000) + 86400 * 7] // Valid for 7 days
          ]
        })}`;
        
        // Generate the QR code
        const qrCodeDataURL = await QRCode.toDataURL(qrData, options);
        
        // Return the QR code as an image
        return new Response(qrCodeDataURL.split(',')[1], {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'inline',
            'Cache-Control': 'public, max-age=86400'
          },
          status: 200
        });
      } catch (e) {
        console.error('Error generating Nostr QR code:', e);
        return NextResponse.json({ error: 'Invalid Nostr data format' }, { status: 400 });
      }
    }
    
    // For standard QR codes
    const qrCodeDataURL = await QRCode.toDataURL(data, options);
    
    // Return the QR code as an image
    return new Response(Buffer.from(qrCodeDataURL.split(',')[1], 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400'
      },
      status: 200
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
} 