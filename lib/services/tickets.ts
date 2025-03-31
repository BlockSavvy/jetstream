import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase-server';
import { BookingFormData, BoardingPass, Flight, Ticket } from '@/app/flights/types';
import { generateQRCodeDataURL } from './qrcode';
import { sendBoardingPassEmail } from './email';
import { sendBoardingPassSMS } from './sms';
import { generateWalletPasses } from './wallet';

interface TicketGenerationOptions {
  passengerName: string;
  email?: string;
  phone?: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

/**
 * Generates random seat assignments for a given number of seats
 * @param count Number of seats to assign
 * @returns Array of seat assignments (e.g. ["12A", "12B"])
 */
function generateSeatAssignments(count: number): string[] {
  const seats: string[] = [];
  const rows = Array.from({ length: 30 }, (_, i) => i + 1); // 1-30
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Shuffle rows and columns for randomness
  const shuffledRows = rows.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    const row = shuffledRows[Math.floor(i / columns.length)];
    const column = columns[i % columns.length];
    seats.push(`${row}${column}`);
  }
  
  return seats;
}

/**
 * Calculate boarding time (30 minutes before departure)
 * @param departureTime Departure time string
 * @returns Boarding time string
 */
function calculateBoardingTime(departureTime: string): string {
  const departure = new Date(departureTime);
  const boarding = new Date(departure.getTime() - 30 * 60 * 1000); // 30 minutes before
  return boarding.toISOString();
}

/**
 * Generates a random gate assignment
 * @returns Gate assignment string (e.g. "A12")
 */
function generateGateAssignment(): string {
  const terminals = ['A', 'B', 'C', 'D'];
  const terminal = terminals[Math.floor(Math.random() * terminals.length)];
  const gateNumber = Math.floor(Math.random() * 30) + 1;
  return `${terminal}${gateNumber}`;
}

/**
 * Creates ticket records in the database for a booking
 * @param bookingId Booking ID
 * @param flight Flight information
 * @param options Options for ticket generation
 * @returns Array of created tickets
 */
export async function generateTickets(
  bookingId: string,
  flight: Flight,
  options: TicketGenerationOptions
): Promise<Ticket[]> {
  try {
    const supabase = await createClient();
    
    // Get the booking to determine how many seats are booked
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }
    
    // Generate seat assignments
    const seats = generateSeatAssignments(booking.seats_booked);
    
    // Calculate boarding time (30 minutes before departure)
    const boardingTime = calculateBoardingTime(flight.departure_time);
    
    // Generate gate assignment
    const gate = generateGateAssignment();
    
    // Create tickets
    const tickets: Ticket[] = [];
    
    for (let i = 0; i < booking.seats_booked; i++) {
      const ticketId = uuidv4();
      const ticketCode = `JS-${Math.floor(Math.random() * 10000000)}`;
      
      // Generate QR code
      const qrCodeData = await generateQRCodeDataURL(ticketCode);
      
      // Create the ticket record
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([
          {
            id: ticketId,
            booking_id: bookingId,
            user_id: booking.user_id,
            flight_id: flight.id,
            ticket_code: ticketCode,
            passenger_name: options.passengerName,
            seat_number: seats[i],
            boarding_time: boardingTime,
            gate,
            qr_code_url: qrCodeData,
            status: 'active',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();
      
      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        continue;
      }
      
      tickets.push(ticket as Ticket);
    }
    
    return tickets;
  } catch (error) {
    console.error('Error generating tickets:', error);
    throw new Error('Failed to generate tickets');
  }
}

/**
 * Creates boarding passes for tickets and handles delivery
 * @param tickets Array of tickets
 * @param flight Flight information
 * @param options Options for boarding pass delivery
 */
export async function generateAndDeliverBoardingPasses(
  tickets: Ticket[],
  flight: Flight,
  options: TicketGenerationOptions
): Promise<void> {
  try {
    for (const ticket of tickets) {
      // Create boarding pass
      const boardingPass: BoardingPass = {
        ticket,
        flight,
        passenger: {
          name: options.passengerName,
          email: options.email,
          phone: options.phone,
        },
        qrCodeData: ticket.qr_code_url,
        walletOptions: {
          appleWalletAvailable: !!ticket.apple_wallet_url,
          googleWalletAvailable: !!ticket.google_wallet_url,
        }
      };
      
      // Generate wallet passes
      try {
        const { appleWalletUrl, googleWalletUrl } = await generateWalletPasses(ticket, flight);
        
        // Update the boarding pass with wallet information
        boardingPass.walletOptions.appleWalletAvailable = !!appleWalletUrl;
        boardingPass.walletOptions.googleWalletAvailable = !!googleWalletUrl;
        
        // Update the ticket in the database
        const supabase = await createClient();
        await supabase
          .from('tickets')
          .update({
            apple_wallet_url: appleWalletUrl || null,
            google_wallet_url: googleWalletUrl || null
          })
          .eq('id', ticket.id);
      } catch (walletError) {
        console.error('Error generating wallet passes:', walletError);
      }
      
      // Send email if requested
      if (options.sendEmail && options.email) {
        try {
          const emailOptions = {
            to: options.email,
            boardingPass: {
              passengerName: options.passengerName,
              seat: ticket.seat_number,
              gate: ticket.gate,
              boardingTime: new Date(ticket.boarding_time).toLocaleTimeString(),
              qrCodeData: ticket.qr_code_url,
            },
            flight: {
              flightNumber: `JS-${flight.id.substring(0, 6)}`,
              departureCity: flight.origin?.city || flight.origin_airport || '',
              arrivalCity: flight.destination?.city || flight.destination_airport || '',
              departureDate: new Date(flight.departure_time).toLocaleDateString(),
              departureTime: new Date(flight.departure_time).toLocaleTimeString(),
            }
          };
          await sendBoardingPassEmail(emailOptions);
        } catch (emailError) {
          console.error('Error sending boarding pass email:', emailError);
        }
      }
      
      // Send SMS if requested
      if (options.sendSMS && options.phone) {
        try {
          const flightInfo = {
            origin: flight.origin?.city || flight.origin_airport || '',
            destination: flight.destination?.city || flight.destination_airport || '',
            date: new Date(flight.departure_time).toLocaleDateString(),
            time: new Date(flight.departure_time).toLocaleTimeString(),
          };
          
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
            (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
          const boardingPassUrl = `${baseUrl}/flights/tickets/${ticket.id}`;
          
          await sendBoardingPassSMS(
            options.phone, 
            ticket.ticket_code, 
            flightInfo, 
            boardingPassUrl
          );
        } catch (smsError) {
          console.error('Error sending boarding pass SMS:', smsError);
        }
      }
    }
  } catch (error) {
    console.error('Error generating and delivering boarding passes:', error);
    throw new Error('Failed to generate and deliver boarding passes');
  }
}

/**
 * Generates tickets and boarding passes for a successful booking
 * @param bookingId Booking ID
 * @param options Options for ticket generation and delivery
 */
export async function processBookingTickets(
  bookingId: string,
  options: TicketGenerationOptions
): Promise<Ticket[]> {
  try {
    const supabase = await createClient();
    
    // Get the booking and flight information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, flights(*)')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }
    
    const flight = booking.flights as Flight;
    
    // Generate tickets
    const tickets = await generateTickets(bookingId, flight, options);
    
    // Generate and deliver boarding passes
    await generateAndDeliverBoardingPasses(tickets, flight, options);
    
    return tickets;
  } catch (error) {
    console.error('Error processing booking tickets:', error);
    throw new Error('Failed to process booking tickets');
  }
} 