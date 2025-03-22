import QRCode from 'qrcode';

/**
 * Generates a QR code data URL for a given ticket code
 * @param ticketCode The ticket code to encode in the QR code
 * @param options Additional options for QR code generation
 * @returns Promise resolving to a data URL containing the QR code
 */
export async function generateQRCodeDataURL(
  ticketCode: string,
  options: QRCode.QRCodeToDataURLOptions = {}
): Promise<string> {
  try {
    // Combine default options with provided options
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      width: 300,
      margin: 1,
      color: {
        dark: '#000',
        light: '#FFF',
      },
      ...options,
    };
    
    // Generate the QR code as a data URL
    return await QRCode.toDataURL(ticketCode, qrOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generates a QR code as a Buffer
 * @param ticketCode The ticket code to encode in the QR code
 * @param options Additional options for QR code generation
 * @returns Promise resolving to a Buffer containing the QR code image
 */
export async function generateQRCodeBuffer(
  ticketCode: string,
  options: QRCode.QRCodeToBufferOptions = {}
): Promise<Buffer> {
  try {
    // Combine default options with provided options
    const qrOptions: QRCode.QRCodeToBufferOptions = {
      width: 300,
      margin: 1,
      color: {
        dark: '#000',
        light: '#FFF',
      },
      ...options,
    };
    
    // Generate the QR code as a Buffer
    return await QRCode.toBuffer(ticketCode, qrOptions);
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
} 