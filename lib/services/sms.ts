import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Sends an SMS notification
 * @param to Phone number to send the SMS to
 * @param message Message content
 */
export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    if (!twilioClient) {
      console.warn('Twilio client not initialized. SMS not sent.');
      return;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
}

/**
 * Sends a boarding pass SMS notification with ticket details and links
 * @param phoneNumber Phone number to send the SMS to
 * @param ticketCode Ticket code for the boarding pass
 * @param flightInfo Flight information (origin, destination, date)
 * @param boardingPassUrl URL to view the boarding pass online
 */
export async function sendBoardingPassSMS(
  phoneNumber: string,
  ticketCode: string,
  flightInfo: {
    origin: string;
    destination: string;
    date: string;
    time: string;
  },
  boardingPassUrl: string
): Promise<void> {
  const message = `
Your JetStream boarding pass for flight from ${flightInfo.origin} to ${flightInfo.destination} on ${flightInfo.date} at ${flightInfo.time} is ready!

Ticket code: ${ticketCode}

View your boarding pass: ${boardingPassUrl}

Thank you for flying with JetStream!
`.trim();

  await sendSMS(phoneNumber, message);
} 