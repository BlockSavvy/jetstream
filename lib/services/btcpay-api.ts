import { createClient } from '@/lib/supabase';
import { JetSharePaymentStatus, JetSharePaymentMethod } from '@/types/jetshare';

// BTCPay Server API types
export type BTCPayInvoiceData = {
  price: number;
  currency: string;
  orderId: string;
  itemDesc: string;
  buyerEmail?: string;
  redirectURL?: string;
  redirectAutomatically?: boolean;
  expirationTime?: number; // in seconds, default 15 minutes
};

export type BTCPayInvoiceResponse = {
  id: string;
  storeId: string;
  amount: string;
  currency: string;
  type: string;
  checkoutLink: string;
  status: string;
  additionalStatus: string;
  monitoringExpiration: string;
  expirationTime: number;
  createdTime: number;
  metadata: {
    orderId: string;
    buyerEmail?: string;
    itemDesc: string;
    redirectURL?: string;
    redirectAutomatically?: boolean;
  };
};

/**
 * Create an invoice with BTCPay Server
 * @param invoiceData - Data for creating the invoice
 */
export async function createBTCPayInvoice(
  invoiceData: BTCPayInvoiceData,
): Promise<BTCPayInvoiceResponse> {
  const apiKey = process.env.BTCPAY_API_KEY;
  const host = process.env.BTCPAY_HOST || 'https://btc.gdyup.xyz';

  if (!apiKey) {
    throw new Error('BTCPay API key is required');
  }

  try {
    const response = await fetch(`${host}/api/v1/stores/current/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}`,
      },
      body: JSON.stringify({
        amount: invoiceData.price,
        currency: invoiceData.currency || 'USD',
        metadata: {
          orderId: invoiceData.orderId,
          itemDesc: invoiceData.itemDesc,
          buyerEmail: invoiceData.buyerEmail,
          redirectURL: invoiceData.redirectURL,
          redirectAutomatically: invoiceData.redirectAutomatically,
        },
        checkout: {
          speedPolicy: "HighSpeed", // Prefer Lightning
          paymentMethods: ["BTC", "BTC-LightningNetwork"],
          expirationMinutes: Math.floor((invoiceData.expirationTime || 900) / 60), // Default 15 minutes
          redirectURL: invoiceData.redirectURL,
          redirectAutomatically: invoiceData.redirectAutomatically || true,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating BTCPay invoice:', errorData);
      throw new Error(`BTCPay API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating BTCPay invoice:', error);
    throw error;
  }
}

/**
 * Check the status of a BTCPay invoice
 * @param invoiceId - The ID of the invoice to check
 */
export async function checkBTCPayInvoice(invoiceId: string): Promise<BTCPayInvoiceResponse> {
  const apiKey = process.env.BTCPAY_API_KEY;
  const host = process.env.BTCPAY_HOST || 'https://btc.gdyup.xyz';

  if (!apiKey) {
    throw new Error('BTCPay API key is required');
  }

  try {
    const response = await fetch(`${host}/api/v1/stores/current/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error checking BTCPay invoice:', errorData);
      throw new Error(`BTCPay API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking BTCPay invoice:', error);
    throw error;
  }
}

/**
 * Update payment status for an offer
 * @param offerId - The ID of the offer to update
 * @param status - The new payment status
 * @param paymentMethod - The payment method used
 * @param details - Any additional details about the payment
 */
export async function updateOfferPaymentStatus(
  offerId: string,
  status: JetSharePaymentStatus,
  paymentMethod: JetSharePaymentMethod,
  details: Record<string, any>
): Promise<void> {
  if (!offerId) {
    throw new Error('Offer ID is required');
  }

  try {
    const supabase = createClient();
    
    // First check if the offer exists
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('id, status, payment_status')
      .eq('id', offerId)
      .single();
      
    if (offerError || !offer) {
      console.error('Error finding offer:', offerError);
      throw new Error(`Offer not found: ${offerId}`);
    }
    
    // Prepare the update data
    const updateData: Record<string, any> = {
      payment_status: status,
      payment_method: paymentMethod,
      payment_details: details,
      updated_at: new Date().toISOString()
    };
    
    // If payment is successful, update the offer status to completed
    if (status === 'paid') {
      updateData.status = 'completed';
    }
    
    // Update the offer
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update(updateData)
      .eq('id', offerId);
    
    if (updateError) {
      console.error('Error updating offer payment status:', updateError);
      throw new Error(`Failed to update offer payment status: ${updateError.message}`);
    }
    
    console.log(`Updated payment status for offer ${offerId} to ${status}`);
    
    // Create a transaction record if payment was successful
    if (status === 'paid') {
      try {
        // Get the offer details to create the transaction
        const { data: offerDetails } = await supabase
          .from('jetshare_offers')
          .select('user_id, matched_user_id, requested_share_amount')
          .eq('id', offerId)
          .single();
          
        if (offerDetails) {
          const { error: transactionError } = await supabase
            .from('jetshare_transactions')
            .insert([
              {
                offer_id: offerId,
                payer_user_id: offerDetails.matched_user_id,
                recipient_user_id: offerDetails.user_id,
                amount: offerDetails.requested_share_amount,
                handling_fee: Math.round(offerDetails.requested_share_amount * 0.075), // 7.5% handling fee
                payment_method: paymentMethod,
                payment_status: 'completed',
                transaction_date: new Date().toISOString(),
                transaction_reference: details.invoice_id || details.payment_intent_id || `manual-${Date.now()}`
              }
            ]);
            
          if (transactionError) {
            console.error('Error creating transaction record:', transactionError);
          }
        }
      } catch (transactionError) {
        console.error('Error creating transaction record:', transactionError);
      }
    }
  } catch (error) {
    console.error('Error in updateOfferPaymentStatus:', error);
    throw error;
  }
}

/**
 * Verify a BTCPay webhook signature
 * @param rawBody - The raw request body
 * @param signature - The signature from the BTCPay-Sig header
 * @param webhookSecret - The webhook secret configured in BTCPay
 */
export function verifyBTCPayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // BTCPay uses HMAC-SHA256
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');
    
    // BTCPay prefixes the signature with "sha256="
    const expectedSignature = signature.replace('sha256=', '');
    return calculatedSignature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
} 