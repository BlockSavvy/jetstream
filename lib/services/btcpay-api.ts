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
    console.error('BTCPay API key is missing from environment variables');
    throw new Error('BTCPay API key is required');
  }

  console.log(`BTCPay: Creating invoice on host ${host} for order ${invoiceData.orderId}`);
  
  try {
    // Validate required fields
    if (!invoiceData.price || isNaN(invoiceData.price)) {
      throw new Error(`Invalid price: ${invoiceData.price}`);
    }
    
    if (!invoiceData.orderId) {
      throw new Error('Order ID is required');
    }
    
    // Prepare request body with defaults for better reliability
    const requestBody = {
      amount: invoiceData.price,
      currency: invoiceData.currency || 'USD',
      metadata: {
        orderId: invoiceData.orderId,
        itemDesc: invoiceData.itemDesc || `Flight share payment ${invoiceData.orderId}`,
        buyerEmail: invoiceData.buyerEmail,
        redirectURL: invoiceData.redirectURL,
        redirectAutomatically: invoiceData.redirectAutomatically ?? true,
      },
      checkout: {
        speedPolicy: "HighSpeed", // Prefer Lightning
        paymentMethods: ["BTC", "BTC-LightningNetwork"],
        expirationMinutes: Math.floor((invoiceData.expirationTime || 900) / 60), // Default 15 minutes
        redirectURL: invoiceData.redirectURL || `${process.env.NEXT_PUBLIC_APP_URL || 'https://gdyup.xyz'}/gdyup/payment/success`,
        redirectAutomatically: invoiceData.redirectAutomatically ?? true,
      }
    };
    
    console.log('BTCPay: Sending request with data:', JSON.stringify(requestBody, null, 2));

    // Make the API request with improved error handling
    const response = await fetch(`${host}/api/v1/stores/current/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Get response data or error text for better debugging
    let responseText;
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Could not read response body';
    }
    
    // Handle errors with more detailed information
    if (!response.ok) {
      console.error(`BTCPay API error (${response.status}): ${responseText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        // If not JSON, use raw text
        errorData = { error: responseText };
      }
      
      // Throw a detailed error
      throw new Error(`BTCPay API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    // Parse the successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing BTCPay response:', e);
      throw new Error(`Invalid BTCPay response format: ${responseText}`);
    }
    
    console.log(`BTCPay: Successfully created invoice ${data.id} for order ${invoiceData.orderId}`);
    
    // Validate the response has the expected fields
    if (!data.id || !data.checkoutLink) {
      console.error('BTCPay response missing required fields:', data);
      throw new Error('Invalid BTCPay response: missing required fields');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating BTCPay invoice:', error);
    
    // If we have some network level error (e.g. connection refused), provide more context
    if (error instanceof Error && error.message.includes('fetch failed')) {
      console.error(`BTCPay server at ${host} may be unreachable or misconfigured`);
      throw new Error(`BTCPay server unreachable: ${error.message}`);
    }
    
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
      .select('id, status')
      .eq('id', offerId)
      .single();
      
    if (offerError || !offer) {
      console.error('Error finding offer:', offerError);
      throw new Error(`Offer not found: ${offerId}`);
    }
    
    console.log(`Updating payment status for offer ${offerId} to ${status}`);
    
    // Prepare the update data based on the actual schema
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      payment_status: status,
      payment_method: paymentMethod,
      payment_details: details
    };
    
    // If payment is successful, update the offer status to completed
    if (status === 'paid') {
      updateData.status = 'completed';
    } else if (status === 'pending') {
      updateData.status = 'payment_pending';
    }
    
    // Update the offer with the payment information
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update(updateData)
      .eq('id', offerId);
    
    if (updateError) {
      console.error('Error updating offer payment status:', updateError);
      throw updateError;
    }
    
    console.log(`Successfully updated payment info for offer ${offerId}`);
    
    // Create a transaction record if payment was successful
    if (status === 'paid') {
      try {
        // Get the offer details to create the transaction
        const { data: offerDetails } = await supabase
          .from('jetshare_offers')
          .select('user_id, matched_user_id, requested_share_amount')
          .eq('id', offerId)
          .single();
          
        if (!offerDetails) {
          console.warn(`Couldn't find offer details for transaction record: ${offerId}`);
          return;
        }
        
        // Create transaction record
        const { error: txError } = await supabase
          .from('jetshare_transactions')
          .insert({
            offer_id: offerId,
            payer_user_id: offerDetails.matched_user_id,
            recipient_user_id: offerDetails.user_id,
            amount: offerDetails.requested_share_amount,
            payment_method: paymentMethod,
            payment_details: details,
            transaction_date: new Date().toISOString(),
            status: 'completed'
          });
          
        if (txError) {
          console.error('Error creating transaction record:', txError);
          // Don't throw here, as the payment was successful
        }
      } catch (txCreateError) {
        console.error('Error creating transaction record:', txCreateError);
        // Don't throw here, as the payment was successful
      }
    }
  } catch (error) {
    console.error('Error updating offer payment status:', error);
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