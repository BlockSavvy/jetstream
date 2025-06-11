import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * API endpoint to generate and download a PDF boarding pass
 * 
 * @param req Request with boardingPassId parameter
 * @returns PDF boarding pass file
 */
export async function GET(req: NextRequest) {
  try {
    // Extract parameters from the URL
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }
    
    // Get offer and boarding pass data from Supabase
    const supabase = createClient();
    
    // Get the offer details
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // Get the boarding pass details
    const { data: ticket, error: ticketError } = await supabase
      .from('jetshare_tickets')
      .select('*')
      .eq('offer_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (ticketError || !ticket) {
      // If no ticket exists in the database, return a mock boarding pass
      return generateMockBoardingPass(offer);
    }
    
    // Generate a PDF boarding pass
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set up page
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Draw border
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - (margin * 2),
      height: height - (margin * 2),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    
    // Draw header
    page.drawText('GDY·UP BOARDING PASS', {
      x: 150,
      y: height - 100,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Draw ticket code
    page.drawText(`TICKET: ${ticket.ticket_code}`, {
      x: 150,
      y: height - 150,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Draw flight info
    page.drawText(`FROM: ${offer.departure_location}`, {
      x: 150,
      y: height - 200,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`TO: ${offer.arrival_location}`, {
      x: 150,
      y: height - 220,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Format date
    const flightDate = new Date(offer.flight_date);
    const formattedDate = flightDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    page.drawText(`DATE: ${formattedDate}`, {
      x: 150,
      y: height - 240,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw passenger info
    page.drawText(`PASSENGER: ${ticket.passenger_name}`, {
      x: 150,
      y: height - 280,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`SEAT: ${ticket.seat_number}`, {
      x: 150,
      y: height - 300,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`GATE: ${ticket.gate}`, {
      x: 150,
      y: height - 320,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw barcode simulation
    for (let i = 0; i < 40; i++) {
      const x = 150 + (i * 6);
      const height = Math.random() * 30 + 20;
      page.drawRectangle({
        x: x,
        y: 200,
        width: 3,
        height: height,
        color: rgb(0, 0, 0),
      });
    }
    
    page.drawText(ticket.ticket_code, {
      x: 150,
      y: 180,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw footer
    page.drawText('This is your boarding pass for your GDY·UP private jet flight.', {
      x: 150,
      y: 120,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Please present this pass at the gate prior to boarding.', {
      x: 150,
      y: 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Return PDF as a response
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gdyup-boarding-pass-${ticket.ticket_code}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating boarding pass PDF:', error);
    return NextResponse.json({ error: 'Failed to generate boarding pass' }, { status: 500 });
  }
}

/**
 * Generate a mock boarding pass when no ticket exists in the database
 */
async function generateMockBoardingPass(offer: any) {
  // Generate a mock ticket code
  const ticketCode = `GDY${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Generate a PDF boarding pass with mock data
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set up page
  const { width, height } = page.getSize();
  const margin = 50;
  
  // Draw border
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - (margin * 2),
    height: height - (margin * 2),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  
  // Draw header
  page.drawText('GDY·UP BOARDING PASS', {
    x: 150,
    y: height - 100,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Draw ticket code
  page.drawText(`TICKET: ${ticketCode}`, {
    x: 150,
    y: height - 150,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Draw flight info
  page.drawText(`FROM: ${offer.departure_location}`, {
    x: 150,
    y: height - 200,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`TO: ${offer.arrival_location}`, {
    x: 150,
    y: height - 220,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Format date
  const flightDate = new Date(offer.flight_date);
  const formattedDate = flightDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  page.drawText(`DATE: ${formattedDate}`, {
    x: 150,
    y: height - 240,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw passenger info
  page.drawText(`PASSENGER: GDY·UP Traveler`, {
    x: 150,
    y: height - 280,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`SEAT: 1A`, {
    x: 150,
    y: height - 300,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`GATE: A1`, {
    x: 150,
    y: height - 320,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw barcode simulation
  for (let i = 0; i < 40; i++) {
    const x = 150 + (i * 6);
    const height = Math.random() * 30 + 20;
    page.drawRectangle({
      x: x,
      y: 200,
      width: 3,
      height: height,
      color: rgb(0, 0, 0),
    });
  }
  
  page.drawText(ticketCode, {
    x: 150,
    y: 180,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw footer
  page.drawText('This is your boarding pass for your GDY·UP private jet flight.', {
    x: 150,
    y: 120,
    size: 10,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Please present this pass at the gate prior to boarding.', {
    x: 150,
    y: 100,
    size: 10,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  
  // Return PDF as a response
  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="gdyup-boarding-pass-${ticketCode}.pdf"`,
    },
  });
} 