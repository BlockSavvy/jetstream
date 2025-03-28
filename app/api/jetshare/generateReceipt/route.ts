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
    const transactionId = searchParams.get('transactionId');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing required parameter: transactionId' }, { status: 400 });
    }
    
    // Get transaction details to validate user permissions
    const { data: transaction, error: txError } = await supabase
      .from('jetshare_transactions')
      .select('*, offer:offer_id(*)')
      .eq('id', transactionId)
      .single();
    
    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    // Validate that the user is either the payer or recipient
    if (transaction.payer_user_id !== user.id && transaction.recipient_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this transaction' }, { status: 403 });
    }
    
    // In a real implementation, we would generate a PDF here
    // For now, we'll just return a success message with a download link
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: 'Receipt generated successfully',
      // In a real implementation, this would be a URL to the generated PDF
      downloadUrl: `/api/jetshare/mockReceipt?id=${transactionId}&timestamp=${Date.now()}`,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        date: transaction.transaction_date,
        paymentMethod: transaction.payment_method,
        status: transaction.payment_status
      }
    });
    
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt', message: (error as Error).message },
      { status: 500 }
    );
  }
} 