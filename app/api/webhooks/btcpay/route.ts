import { NextRequest, NextResponse } from 'next/server';
import { verifyBTCPayWebhookSignature, updateOfferPaymentStatus } from '@/lib/services/btcpay-api';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Get the signature from the BTCPay-Sig header
    const signature = request.headers.get('BTCPay-Sig') || '';
    const webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.error('BTCPay webhook secret is not configured');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    // Verify the signature
    const isValid = verifyBTCPayWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid BTCPay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process the event
    const { invoiceId, eventType } = body;

    if (!invoiceId) {
      console.error('No invoiceId in webhook payload');
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    console.log(`Processing BTCPay webhook for invoice ${invoiceId}, event type: ${eventType}`);

    // Extract the orderId to get the offer ID
    const orderId = body.metadata?.orderId || '';
    const offerId = orderId.replace('GDYUP-', '');

    if (!offerId) {
      console.error('Could not determine offer ID from orderId:', orderId);
      return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 });
    }

    // Handle different event types
    if (eventType === 'InvoiceSettled' || eventType === 'InvoicePaymentSettled') {
      // Payment completed successfully
      await updateOfferPaymentStatus(
        offerId,
        'paid',
        'btcpay',
        {
          invoice_id: invoiceId,
          status: 'paid',
          payment_timestamp: new Date().toISOString(),
          event_type: eventType,
          amount: body.amount,
          currency: body.currency
        }
      );

      console.log(`BTCPay payment completed for offer ${offerId}`);
    } 
    else if (eventType === 'InvoiceExpired') {
      // Payment expired
      await updateOfferPaymentStatus(
        offerId,
        'expired',
        'btcpay',
        {
          invoice_id: invoiceId,
          status: 'expired',
          event_type: eventType
        }
      );

      console.log(`BTCPay payment expired for offer ${offerId}`);
    }
    else if (eventType === 'InvoicePaymentFailed') {
      // Payment failed
      await updateOfferPaymentStatus(
        offerId,
        'failed',
        'btcpay',
        {
          invoice_id: invoiceId,
          status: 'failed',
          event_type: eventType
        }
      );

      console.log(`BTCPay payment failed for offer ${offerId}`);
    }
    else {
      // Other event types (log but don't change state)
      console.log(`Unhandled BTCPay event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling BTCPay webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 