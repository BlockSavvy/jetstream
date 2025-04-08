/**
 * Payment API Service
 * Server-side wrapper for payment gateways that avoids client-side dependencies
 */

import axios from 'axios';

// Coinbase Commerce API types
export type CoinbaseChargeData = {
  name: string;
  description: string;
  local_price: {
    amount: string;
    currency: string;
  };
  pricing_type: string;
  metadata: Record<string, any>;
  redirect_url?: string;
  cancel_url?: string;
};

export type CoinbaseChargeResponse = {
  data: {
    id: string;
    hosted_url: string;
    code: string;
    created_at: string;
    expires_at: string;
    pricing: {
      local: { amount: string; currency: string };
      [key: string]: any;
    };
    [key: string]: any;
  };
};

/**
 * Create a charge with Coinbase Commerce
 * Server-side implementation that avoids the problematic coinbase-commerce-node dependency
 */
export async function createCoinbaseCharge(
  chargeData: CoinbaseChargeData,
  apiKey: string
): Promise<CoinbaseChargeResponse> {
  if (!apiKey) {
    throw new Error('Coinbase Commerce API key is required');
  }

  try {
    const response = await axios.post(
      'https://api.commerce.coinbase.com/charges',
      chargeData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': apiKey,
          'X-CC-Version': '2018-03-22'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating Coinbase charge:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Coinbase API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error('Failed to create Coinbase charge');
  }
}

/**
 * Check if a charge is completed
 */
export async function checkCoinbaseCharge(
  chargeId: string,
  apiKey: string
): Promise<{
  status: string;
  payment_status?: string;
  timeline?: Array<{ status: string; time: string }>;
}> {
  if (!apiKey) {
    throw new Error('Coinbase Commerce API key is required');
  }

  try {
    const response = await axios.get(
      `https://api.commerce.coinbase.com/charges/${chargeId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': apiKey,
          'X-CC-Version': '2018-03-22'
        }
      }
    );

    return {
      status: response.data.data.status,
      payment_status: response.data.data.payment_status,
      timeline: response.data.data.timeline
    };
  } catch (error) {
    console.error('Error checking Coinbase charge:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Coinbase API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error('Failed to check Coinbase charge');
  }
}

/**
 * Verify a Coinbase webhook signature
 * @param payload - The raw request body as a string
 * @param signature - The X-CC-Webhook-Signature header
 * @param secret - Your webhook shared secret
 */
export function verifyCoinbaseWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implementation using built-in crypto instead of coinbase package
  const crypto = require('crypto');
  
  // Create HMAC using the shared secret
  const hmac = crypto.createHmac('sha256', secret);
  
  // Update with payload
  hmac.update(payload);
  
  // Get the digest
  const computedSignature = hmac.digest('hex');
  
  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
} 