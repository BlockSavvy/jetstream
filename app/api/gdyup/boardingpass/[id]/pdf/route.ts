import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import QRCode from 'qrcode';

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
      
      // TODO: In a production environment, we would check that the user
      // is authorized to access this boarding pass
    }
    
    // Create a PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `GDY·UP Boarding Pass - ${offerData.departure_location} to ${offerData.arrival_location}`,
        Author: 'GDY·UP Aviation',
        Keywords: 'boarding pass, flight, private jet'
      }
    });
    
    // Buffer to store PDF
    const chunks: Buffer[] = [];
    
    // Collect PDF data chunks
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'gdyup-boarding',
      id: boardingPassId,
      ticket: boardingPassData.ticket_code,
      flight: {
        departure: offerData.departure_location,
        arrival: offerData.arrival_location,
        date: offerData.flight_date,
      },
      passenger: boardingPassData.passenger_name,
      timestamp: new Date().toISOString()
    });
    
    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 150
    });
    
    // Remove the data:image/png;base64, prefix
    const qrCodeData = qrCodeDataUrl.split(',')[1];
    
    // Add content to the PDF
    
    // Add logo
    // doc.image('public/logo.png', 50, 50, { width: 100 });
    
    // Add header
    doc
      .fontSize(24)
      .text('GDY·UP', 50, 50, { align: 'left' })
      .fontSize(10)
      .text('BITCOIN-NATIVE FLIGHT SHARING', 50, 80, { align: 'left' })
      .fontSize(18)
      .text('BOARDING PASS', 50, 110, { align: 'left' });
    
    // Add flight information
    doc
      .moveDown(2)
      .fontSize(12)
      .text('FLIGHT', 50, 150, { continued: true })
      .fontSize(16)
      .text(`   ${boardingPassData.ticket_code}`, { align: 'left' });
    
    // Add boarding pass content
    doc
      .moveDown(1)
      .strokeColor('#dddddd')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);
    
    // Passenger info
    doc
      .fontSize(10)
      .text('PASSENGER', 50, 230, { continued: false })
      .moveUp()
      .text('SEAT', 200, doc.y, { continued: false })
      .moveUp()
      .text('DATE', 300, doc.y, { continued: false })
      .moveUp()
      .text('BOARDING', 450, doc.y, { continued: false })
      .moveDown(0.5);
    
    doc
      .fontSize(14)
      .text(boardingPassData.passenger_name, 50, doc.y, { continued: false })
      .moveUp()
      .text(boardingPassData.seat, 200, doc.y, { continued: false })
      .moveUp()
      .text(format(new Date(offerData.flight_date), 'MMM d, yyyy'), 300, doc.y, { continued: false })
      .moveUp()
      .text(format(new Date(offerData.flight_date), 'h:mm a'), 450, doc.y, { continued: false })
      .moveDown(2);
    
    // Flight route
    doc
      .fontSize(14)
      .text('FROM', 50, doc.y, { continued: false })
      .moveUp()
      .text('TO', 300, doc.y, { continued: false })
      .moveDown(0.5);
    
    doc
      .fontSize(18)
      .text(offerData.departure_location_code || offerData.departure_location.substring(0, 3).toUpperCase(), 50, doc.y, { continued: true })
      .fontSize(14)
      .text(`  ${offerData.departure_location}`, { continued: false })
      .moveUp()
      .fontSize(18)
      .text(offerData.arrival_location_code || offerData.arrival_location.substring(0, 3).toUpperCase(), 300, doc.y, { continued: true })
      .fontSize(14)
      .text(`  ${offerData.arrival_location}`, { continued: false })
      .moveDown(2);
    
    // Flight details
    doc
      .strokeColor('#dddddd')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);
    
    // Aircraft type
    doc
      .fontSize(10)
      .text('AIRCRAFT', 50, doc.y, { continued: false })
      .moveDown(0.5)
      .fontSize(14)
      .text(offerData.aircraft_type || 'Private Jet', 50, doc.y, { continued: false })
      .moveDown(1);
    
    // Add QR code
    doc.image(Buffer.from(qrCodeData, 'base64'), 400, 350, { width: 150 });
    
    // Add instructions
    doc
      .fontSize(10)
      .text('BOARDING INSTRUCTIONS', 50, 400, { continued: false })
      .moveDown(0.5)
      .fontSize(12)
      .text('Please arrive at the FBO terminal 30 minutes before departure.', 50, doc.y, { continued: false })
      .moveDown(0.5)
      .text('Present this boarding pass and a valid ID at check-in.', 50, doc.y, { continued: false })
      .moveDown(2);
    
    // Add footer
    doc
      .fontSize(8)
      .text('This boarding pass was generated by GDY·UP, a Bitcoin-native flight sharing platform.', 50, 700, { align: 'center' })
      .moveDown(0.5)
      .text('For assistance, contact support@gdyup.com', { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    // Return PDF as a stream
    return new Response(Buffer.concat(chunks), {
      headers: {
        'Content-Disposition': `attachment; filename="gdyup-boarding-${boardingPassId}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    console.error('Error generating PDF boarding pass:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF boarding pass', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 