import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const isTestMode = searchParams.get('test') === 'true' || transactionId?.startsWith('test-');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing required parameter: transactionId' }, { status: 400 });
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // For test transactions, we'll bypass auth checks
    if (!isTestMode && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For test transactions, return a mock receipt without further checks
    if (isTestMode || transactionId.startsWith('test-')) {
      console.log('Generating test receipt for transaction:', transactionId);
      
      return NextResponse.json({
        success: true,
        message: 'Test receipt generated successfully',
        downloadUrl: `/api/jetshare/mockReceipt?id=${transactionId}&test=true&timestamp=${Date.now()}`,
        transaction: {
          id: transactionId,
          amount: 5000,
          date: new Date().toISOString(),
          paymentMethod: 'card',
          status: 'completed'
        }
      });
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
    if (user && transaction.payer_user_id !== user.id && transaction.recipient_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this transaction' }, { status: 403 });
    }
    
    // In a real implementation, we would generate a PDF here
    // For now, we'll just return a success message with a download link
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
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