import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { BoardingPass } from '@/app/flights/types';
import QRCode from 'qrcode';

// Configure SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  auth: {
    user: process.env.EMAIL_SERVER_USER || 'user',
    pass: process.env.EMAIL_SERVER_PASSWORD || 'password',
  },
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
});

// Email types
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

// Boarding pass email options
export interface BoardingPassEmailOptions {
  to: string;
  boardingPass: {
    passengerName: string;
    seat: string;
    gate: string;
    boardingTime: string;
    qrCodeData: string;
  };
  flight: {
    flightNumber: string;
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    departureTime: string;
  };
}

// Helper function to generate QR code
async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Send an email to a user
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: string
): Promise<void> {
  // Implementation using nodemailer or SendGrid
  try {
    // Use SendGrid if API key is available
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: process.env.EMAIL_FROM || 'noreply@jetstreamair.com',
        subject,
        text: content,
        html: content,
      });
    } else {
      // Fallback to nodemailer for local development
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@jetstreamair.com',
        to,
        subject,
        text: content,
        html: content,
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send a JetShare notification email
 */
export function jetShareNotificationEmail(
  to: string,
  subject: string,
  content: string
): Promise<void> {
  return sendEmail(to, subject, content);
}

/**
 * Sends a boarding pass email with ticket details and attachments
 */
export async function sendBoardingPassEmail(
  options: BoardingPassEmailOptions
): Promise<void> {
  const { to, boardingPass, flight } = options;
  
  // Generate a QR code for the boarding pass
  const qrCodeDataUrl = await generateQRCode(boardingPass.qrCodeData);
  
  // Create the HTML content for the email
  const subject = `Your Boarding Pass for Flight ${flight.flightNumber}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Boarding Pass</h2>
      <p>Thank you for choosing JetStream Air. Your flight is confirmed.</p>
      
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3>Flight Details</h3>
        <p><strong>Flight:</strong> ${flight.flightNumber}</p>
        <p><strong>From:</strong> ${flight.departureCity}</p>
        <p><strong>To:</strong> ${flight.arrivalCity}</p>
        <p><strong>Date:</strong> ${flight.departureDate}</p>
        <p><strong>Time:</strong> ${flight.departureTime}</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeDataUrl}" alt="Boarding Pass QR Code" style="max-width: 200px; width: 100%;" />
          <p>Scan this QR code at the airport</p>
        </div>
        
        <p><strong>Passenger:</strong> ${boardingPass.passengerName}</p>
        <p><strong>Seat:</strong> ${boardingPass.seat}</p>
        <p><strong>Gate:</strong> ${boardingPass.gate}</p>
        <p><strong>Boarding:</strong> ${boardingPass.boardingTime}</p>
      </div>
      
      <p>Please arrive at the airport at least 2 hours before your scheduled departure time.</p>
      <p>We wish you a pleasant flight!</p>
      
      <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply.</p>
    </div>
  `;
  
  await sendEmail(to, subject, htmlContent);
} 