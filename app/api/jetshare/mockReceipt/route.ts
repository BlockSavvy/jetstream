import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('id');
    const isTestMode = searchParams.get('test') === 'true' || transactionId?.startsWith('test-');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // For test transactions, we'll bypass auth checks
    if (!isTestMode && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get customer info - use email if user is available, otherwise use placeholder
    const customerInfo = user ? user.email : 'guest@example.com';
    
    // In a real implementation, we would generate and return a PDF here
    // For now, we'll just return plain text representing a receipt
    const receiptText = `
JetStream Flight Share Receipt
==============================
Transaction ID: ${transactionId}
Date: ${new Date().toLocaleDateString()}
Customer: ${customerInfo}

${isTestMode ? '[TEST MODE - This is a demo receipt]' : ''}

Thank you for using JetStream!
Your digital boarding pass will be available 24 hours before your flight.
Please check your email for flight updates and boarding information.
    `;
    
    // Set the appropriate headers for a text download
    const headers = new Headers();
    headers.set('Content-Type', 'text/plain');
    headers.set('Content-Disposition', `attachment; filename="jetshare-receipt-${transactionId}.txt"`);
    
    return new NextResponse(receiptText, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error generating mock receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt', message: (error as Error).message },
      { status: 500 }
    );
  }
} 