import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { BoardingPass } from '@/app/flights/types';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create nodemailer transporter (fallback if SendGrid is not configured)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Sends an email using either SendGrid or SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Use SendGrid if API key is configured
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: options.to,
        from: process.env.EMAIL_FROM || 'noreply@jetstreamair.com',
        subject: options.subject,
        text: options.text || '',
        html: options.html,
        attachments: options.attachments ? options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? attachment.content 
            : attachment.content.toString('base64'),
          type: attachment.contentType,
          disposition: 'attachment',
          contentId: attachment.filename.split('.')[0],
        })) : undefined,
      });
    } else {
      // Fallback to nodemailer
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@jetstreamair.com',
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
        attachments: options.attachments,
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Sends a boarding pass email with ticket details and attachments
 */
export async function sendBoardingPassEmail(
  email: string,
  boardingPass: BoardingPass,
  attachments: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }> = []
): Promise<void> {
  const { flight, ticket, passenger } = boardingPass;
  
  const departureDate = new Date(flight.departure_time).toLocaleDateString();
  const departureTime = new Date(flight.departure_time).toLocaleTimeString();
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0070f3; color: white; padding: 20px; text-align: center;">
        <h1>Your JetStream Boarding Pass</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <h2>Flight Details</h2>
        <p><strong>Flight:</strong> JS-${flight.id.substring(0, 6)}</p>
        <p><strong>From:</strong> ${flight.origin?.city || flight.origin_airport}</p>
        <p><strong>To:</strong> ${flight.destination?.city || flight.destination_airport}</p>
        <p><strong>Date:</strong> ${departureDate}</p>
        <p><strong>Departure Time:</strong> ${departureTime}</p>
        <p><strong>Gate:</strong> ${ticket.gate}</p>
        <p><strong>Boarding Time:</strong> ${ticket.boarding_time}</p>
        
        <h2>Passenger Information</h2>
        <p><strong>Name:</strong> ${passenger.name}</p>
        <p><strong>Seat:</strong> ${ticket.seat_number}</p>
        <p><strong>Ticket Code:</strong> ${ticket.ticket_code}</p>
        
        <div style="text-align: center; margin-top: 20px;">
          <img src="cid:qrcode" alt="Boarding Pass QR Code" style="max-width: 200px;" />
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          ${boardingPass.walletOptions.appleWalletAvailable ? 
            `<p><a href="${ticket.apple_wallet_url}" style="display: inline-block; background-color: black; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Add to Apple Wallet</a></p>` : ''}
          ${boardingPass.walletOptions.googleWalletAvailable ? 
            `<p><a href="${ticket.google_wallet_url}" style="display: inline-block; background-color: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Add to Google Wallet</a></p>` : ''}
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Thank you for flying with JetStream!</p>
        <p>If you have any questions, please contact our customer service.</p>
      </div>
    </div>
  `;
  
  // Add QR code as an inline attachment
  const emailAttachments = [
    {
      filename: 'qrcode.png',
      content: boardingPass.qrCodeData,
      contentType: 'image/png',
      cid: 'qrcode', // Same as the src in the HTML
    },
    ...attachments,
  ];
  
  await sendEmail({
    to: email,
    subject: `Your JetStream Boarding Pass: ${flight.origin?.code} to ${flight.destination?.code}`,
    html,
    attachments: emailAttachments,
  });
} 