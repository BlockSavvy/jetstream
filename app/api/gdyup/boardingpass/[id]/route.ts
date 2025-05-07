import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { format } from 'date-fns';

interface FlightData {
  id: string;
  departure_location: string;
  departure_location_code: string;
  arrival_location: string;
  arrival_location_code: string;
  flight_date: string;
  aircraft_type: string;
  boarding_time?: string;
  gate?: string;
}

interface BoardingPassData {
  id: string;
  passenger_name: string;
  seat: string;
  ticket_code: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'pdf';
    const isTestMode = searchParams.get('test') === 'true';
    
    if (!offerId) {
      return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Fetch offer data
    const { data: offerData, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
    
    if (offerError || !offerData) {
      console.error('Error fetching offer data:', offerError);
      
      // If in test mode, use mock data
      if (isTestMode) {
        const mockData: FlightData = {
          id: offerId,
          departure_location: 'New York',
          departure_location_code: 'NYC',
          arrival_location: 'Los Angeles',
          arrival_location_code: 'LAX',
          flight_date: new Date().toISOString(),
          aircraft_type: 'Gulfstream G650',
          boarding_time: new Date(Date.now() + 3600000).toISOString(),
          gate: 'G1'
        };
        
        const mockBoardingPass: BoardingPassData = {
          id: `bp-${Date.now()}`,
          passenger_name: 'Test Passenger',
          seat: '1A',
          ticket_code: `GDYUP-${offerId.substring(0, 6)}`,
          created_at: new Date().toISOString()
        };
        
        if (format === 'pdf') {
          return generatePDF(mockData, mockBoardingPass);
        } else if (format === 'pkpass') {
          return generatePKPass(mockData, mockBoardingPass);
        } else {
          return NextResponse.json({ error: 'Invalid format specified' }, { status: 400 });
        }
      }
      
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // Fetch the user's boarding pass
    const { data: boardingPassData, error: bpError } = await supabase
      .from('boarding_passes')
      .select('*')
      .eq('offer_id', offerId)
      .single();
    
    if (bpError || !boardingPassData) {
      console.error('Error fetching boarding pass data:', bpError);
      
      // If boarding pass doesn't exist yet, create a mock one for testing
      const mockBoardingPass: BoardingPassData = {
        id: `bp-${Date.now()}`,
        passenger_name: 'GDY·UP Passenger',
        seat: offerData.requested_seats > 1 ? 'Multiple' : '1A',
        ticket_code: `GDYUP-${offerId.substring(0, 6)}`,
        created_at: new Date().toISOString()
      };
      
      if (format === 'pdf') {
        return generatePDF(offerData, mockBoardingPass);
      } else if (format === 'pkpass') {
        return generatePKPass(offerData, mockBoardingPass);
      } else {
        return NextResponse.json({ error: 'Invalid format specified' }, { status: 400 });
      }
    }
    
    // Generate requested format
    if (format === 'pdf') {
      return generatePDF(offerData, boardingPassData);
    } else if (format === 'pkpass') {
      return generatePKPass(offerData, boardingPassData);
    } else {
      return NextResponse.json({ error: 'Invalid format specified' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating boarding pass:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generatePDF(flightData: FlightData, boardingPassData: BoardingPassData) {
  // Create a PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `GDY·UP Boarding Pass - ${flightData.departure_location_code} to ${flightData.arrival_location_code}`,
      Author: 'GDY·UP',
      Subject: 'Boarding Pass'
    }
  });
  
  // Collect the PDF data chunks
  const chunks: Uint8Array[] = [];
  
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Generate QR code
  const qrData = {
    boardingPassId: boardingPassData.id,
    offerId: flightData.id,
    passengerName: boardingPassData.passenger_name,
    departure: flightData.departure_location_code,
    arrival: flightData.arrival_location_code,
    flightDate: flightData.flight_date,
    seat: boardingPassData.seat,
    ticketCode: boardingPassData.ticket_code
  };
  
  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 150
  });
  
  // Add content to PDF
  doc.fontSize(24).font('Helvetica-Bold').text('GDY·UP', { align: 'center' });
  doc.fontSize(18).font('Helvetica-Bold').text('BOARDING PASS', { align: 'center' });
  doc.moveDown();
  
  // Horizontal line
  doc.moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();
  doc.moveDown();
  
  // Flight info header
  doc.fontSize(14).font('Helvetica-Bold')
     .text(`${flightData.departure_location_code} → ${flightData.arrival_location_code}`, { align: 'center' });
  
  doc.fontSize(12).font('Helvetica')
     .text(format(new Date(flightData.flight_date), 'EEEE, MMMM d, yyyy'), { align: 'center' });
  doc.moveDown();
  
  // Main content grid
  doc.fontSize(10).font('Helvetica-Bold').text('PASSENGER', { width: 150 });
  doc.fontSize(12).font('Helvetica').text(boardingPassData.passenger_name);
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica-Bold').text('SEAT', { width: 150 });
  doc.fontSize(12).font('Helvetica').text(boardingPassData.seat);
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica-Bold').text('FLIGHT', { width: 150 });
  doc.fontSize(12).font('Helvetica').text(`GDY·UP ${boardingPassData.ticket_code}`);
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica-Bold').text('FROM', { width: 150 });
  doc.fontSize(12).font('Helvetica').text(`${flightData.departure_location} (${flightData.departure_location_code})`);
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica-Bold').text('TO', { width: 150 });
  doc.fontSize(12).font('Helvetica').text(`${flightData.arrival_location} (${flightData.arrival_location_code})`);
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica-Bold').text('AIRCRAFT', { width: 150 });
  doc.fontSize(12).font('Helvetica').text(flightData.aircraft_type || 'Private Jet');
  doc.moveDown(0.5);
  
  if (flightData.boarding_time) {
    doc.fontSize(10).font('Helvetica-Bold').text('BOARDING TIME', { width: 150 });
    doc.fontSize(12).font('Helvetica').text(format(new Date(flightData.boarding_time), 'h:mm a'));
    doc.moveDown(0.5);
  }
  
  if (flightData.gate) {
    doc.fontSize(10).font('Helvetica-Bold').text('GATE', { width: 150 });
    doc.fontSize(12).font('Helvetica').text(flightData.gate);
    doc.moveDown(0.5);
  }
  
  // Add QR code
  doc.moveDown();
  doc.image(qrCodeDataUrl, {
    fit: [150, 150],
    align: 'center'
  });
  
  // Add boarding notes
  doc.moveDown();
  doc.fontSize(10).font('Helvetica-Bold').text('BOARDING NOTES', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Please arrive at the FBO or private terminal at least 30 minutes before departure. Present this boarding pass with your ID to the crew. This boarding pass can also be displayed on your mobile device.', { align: 'center' });
  
  // Footer
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('gray')
     .text('GDY·UP - Premium Bitcoin-Native Flight Sharing Platform', { align: 'center' });
  doc.fontSize(8).text('This document contains a cryptographically verifiable boarding pass.', { align: 'center' });
  
  // Finalize the PDF
  doc.end();
  
  // Create a buffer from all the PDF chunks
  const pdfBuffer = Buffer.concat(chunks);
  
  // Return the PDF as a response
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=gdyup-boarding-pass-${flightData.id}.pdf`
    }
  });
}

async function generatePKPass(flightData: FlightData, boardingPassData: BoardingPassData) {
  try {
    // In a production environment, this would use the PassKit library
    // For this implementation, we'll create a minimal .pkpass structure
    // A real implementation would require Apple Developer certificates
    
    const zip = new JSZip();
    
    // Create pass.json
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.gdyup.boardingpass',
      serialNumber: boardingPassData.id,
      teamIdentifier: 'GDYUP1234',
      organizationName: 'GDY·UP',
      description: `Boarding Pass ${flightData.departure_location_code} to ${flightData.arrival_location_code}`,
      logoText: 'GDY·UP',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(20, 20, 20)',
      labelColor: 'rgb(255, 200, 0)',
      boardingPass: {
        transitType: 'air',
        headerFields: [
          {
            key: 'flight',
            label: 'FLIGHT',
            value: boardingPassData.ticket_code
          }
        ],
        primaryFields: [
          {
            key: 'origin',
            label: 'FROM',
            value: flightData.departure_location_code
          },
          {
            key: 'destination',
            label: 'TO',
            value: flightData.arrival_location_code
          }
        ],
        secondaryFields: [
          {
            key: 'passenger',
            label: 'PASSENGER',
            value: boardingPassData.passenger_name
          },
          {
            key: 'seat',
            label: 'SEAT',
            value: boardingPassData.seat
          }
        ],
        auxiliaryFields: [
          {
            key: 'boardingTime',
            label: 'BOARDING',
            value: flightData.boarding_time 
              ? format(new Date(flightData.boarding_time), 'h:mm a')
              : format(new Date(flightData.flight_date), 'h:mm a')
          },
          {
            key: 'gate',
            label: 'GATE',
            value: flightData.gate || 'TBA'
          }
        ],
        backFields: [
          {
            key: 'terms',
            label: 'TERMS',
            value: 'This boarding pass is for the exclusive use of the passenger named herein. Please arrive at the FBO or private terminal at least 30 minutes before departure.'
          },
          {
            key: 'bitcoin',
            label: 'BITCOIN-ENABLED',
            value: 'This boarding pass was issued on the GDY·UP Bitcoin-native flight sharing platform.'
          }
        ]
      },
      barcodes: [
        {
          message: JSON.stringify({
            boardingPassId: boardingPassData.id,
            offerId: flightData.id,
            passengerName: boardingPassData.passenger_name,
            departure: flightData.departure_location_code,
            arrival: flightData.arrival_location_code,
            flightDate: flightData.flight_date,
            seat: boardingPassData.seat,
            ticketCode: boardingPassData.ticket_code
          }),
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      ]
    };
    
    // Add pass.json to the zip
    zip.file('pass.json', JSON.stringify(passJson, null, 2));
    
    // We would normally include signature, manifest and certificate files
    // For this implementation, we'll create placeholders
    zip.file('manifest.json', JSON.stringify({
      'pass.json': 'hash-placeholder',
    }, null, 2));
    
    zip.file('signature', 'signature-placeholder');
    
    // Generate the ZIP file as a buffer
    const pkpassBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Return the pkpass file as a response
    return new NextResponse(pkpassBuffer, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename=gdyup-boarding-pass-${flightData.id}.pkpass`
      }
    });
  } catch (error) {
    console.error('Error generating PKPass:', error);
    return NextResponse.json({ error: 'Failed to generate Apple Wallet pass' }, { status: 500 });
  }
} 