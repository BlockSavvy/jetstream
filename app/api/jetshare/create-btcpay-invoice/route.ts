import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createBTCPayInvoice, updateOfferPaymentStatus } from '@/lib/services/btcpay-api';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('create-btcpay-invoice API called');
  
  try {
    const requestData = await request.json();
    const { 
      orderId, 
      amount, 
      currency = 'USD', 
      description, 
      buyerEmail, 
      redirectUrl, 
      buyerId,
      metadata = {} 
    } = requestData;
    
    // Basic validation
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json(
        { success: false, message: 'Valid amount is required' },
        { status: 400 }
      );
    }
    
    // Check for required configuration
    if (!process.env.BTCPAY_API_KEY || !process.env.BTCPAY_HOST) {
      console.error('BTCPay Server configuration is missing in environment variables');
      return NextResponse.json(
        { success: false, message: 'Payment provider is not properly configured' },
        { status: 500 }
      );
    }
    
    // Prepare invoice data for BTCPay Server
    const invoiceData = {
      price: Number(amount),
      currency: currency,
      orderId: orderId,
      itemDesc: description || `Payment for order ${orderId}`,
      buyerEmail: buyerEmail,
      redirectURL: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://gdyup.xyz'}/gdyup/payment/success?offer_id=${orderId}`,
      redirectAutomatically: true,
      expirationTime: 3600 // 1 hour expiration
    };
    
    console.log('Creating BTCPay invoice with data:', {
      ...invoiceData,
      buyerEmail: invoiceData.buyerEmail ? '***@***' : undefined // Redact email for logs
    });
    
    // Create a BTCPay invoice
    const invoice = await createBTCPayInvoice(invoiceData);
    
    if (!invoice || !invoice.id || !invoice.checkoutLink) {
      throw new Error('BTCPay Server returned an invalid invoice response');
    }
    
    console.log(`BTCPay invoice created successfully: ${invoice.id}`);
    
    // If this is for a jetshare offer, update the offer status
    if (orderId && orderId.length > 10) { // Basic check for UUID-like ID
      try {
        await updateOfferPaymentStatus(
          orderId,
          'pending',
          'btcpay',
          {
            invoice_id: invoice.id,
            checkout_url: invoice.checkoutLink,
            created_at: new Date().toISOString(),
            metadata
          }
        );
      } catch (updateError) {
        console.error('Error updating offer status:', updateError);
        // Continue anyway as the invoice was created successfully
      }
    }
    
    return NextResponse.json({
      success: true,
      id: invoice.id,
      checkoutLink: invoice.checkoutLink,
      status: invoice.status,
      expiresAt: invoice.expirationTime ? new Date(invoice.expirationTime * 1000).toISOString() : undefined
    });
    
  } catch (error) {
    console.error('Error creating BTCPay invoice:', error);
    
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof Error) {
      if (error.message.includes('BTCPay API key is required') || 
          error.message.includes('server unreachable') ||
          error.message.includes('configuration')) {
        return NextResponse.json(
          { success: false, message: 'Payment provider is temporarily unavailable', error: error.message },
          { status: 503 } // Service Unavailable
        );
      }
      
      if (error.message.includes('BTCPay API error') && error.message.includes('401')) {
        return NextResponse.json(
          { success: false, message: 'Payment provider authorization failed', error: error.message },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { success: false, message: 'Invalid request to payment provider', error: error.message },
          { status: 400 }
        );
      }
    }
    
    // For other errors, return a generic 500 error
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create payment invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 