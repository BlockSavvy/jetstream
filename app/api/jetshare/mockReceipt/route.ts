import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 });
    }
    
    // In a real implementation, we would generate and return a PDF here
    // For now, we'll just return plain text representing a receipt
    const receiptText = `
JetStream Flight Share Receipt
==============================
Transaction ID: ${transactionId}
Date: ${new Date().toLocaleDateString()}
Customer: ${user.email}

Thank you for using JetStream!
This is a mock receipt for demonstration purposes.
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