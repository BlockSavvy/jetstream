import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const offerId = searchParams.get('offerId');
    const format = searchParams.get('format') || 'html'; // html, pdf, wallet
    const isTestMode = searchParams.get('test') === 'true' || transactionId?.startsWith('test-');
    
    if (!transactionId && !offerId) {
      return NextResponse.json({ error: 'Missing required parameter: transactionId or offerId' }, { status: 400 });
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // For test transactions, we'll bypass auth checks
    if (!isTestMode && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For test transactions, return a mock boarding pass
    if (isTestMode) {
      console.log('Generating test boarding pass');
      
      if (format === 'wallet') {
        // Return a wallet pass JSON structure
        return NextResponse.json({
          success: true,
          message: 'Test boarding pass generated for Apple Wallet',
          walletUrl: `/api/jetshare/appleWallet?id=${transactionId || offerId}&test=true&timestamp=${Date.now()}`,
          boardingPass: {
            id: transactionId || `test-boardingpass-${Date.now()}`,
            flightNumber: 'JS1234',
            departureLocation: 'New York (JFK)',
            arrivalLocation: 'Los Angeles (LAX)',
            departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            arrivalTime: new Date(Date.now() + 86400000 + 21600000).toISOString(), // Tomorrow + 6 hours
            passengerName: user?.email || 'Test Passenger',
            gate: 'A12',
            seat: '1A',
            boardingTime: new Date(Date.now() + 86400000 - 3600000).toISOString(), // 1 hour before departure
            status: 'CONFIRMED'
          }
        });
      } else {
        // Return a URL for downloading the boarding pass
        return NextResponse.json({
          success: true,
          message: 'Test boarding pass generated successfully',
          downloadUrl: `/api/jetshare/mockBoardingPass?id=${transactionId || offerId}&test=true&timestamp=${Date.now()}`,
          boardingPass: {
            id: transactionId || `test-boardingpass-${Date.now()}`,
            flightNumber: 'JS1234',
            departureLocation: 'New York (JFK)',
            arrivalLocation: 'Los Angeles (LAX)',
            departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            arrivalTime: new Date(Date.now() + 86400000 + 21600000).toISOString(), // Tomorrow + 6 hours
            passengerName: user?.email || 'Test Passenger',
            gate: 'A12',
            seat: '1A',
            boardingTime: new Date(Date.now() + 86400000 - 3600000).toISOString(), // 1 hour before departure
            status: 'CONFIRMED'
          }
        });
      }
    }
    
    // For real transactions, get the flight details from the database
    let transactionData;
    let offerData;
    
    if (transactionId) {
      // Get transaction details
      const { data, error } = await supabase
        .from('jetshare_transactions')
        .select(`
          *,
          offer:offer_id(*)
        `)
        .eq('id', transactionId)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      
      transactionData = data;
      offerData = data.offer;
      
    } else if (offerId) {
      // Get offer details
      const { data, error } = await supabase
        .from('jetshare_offers')
        .select('*')
        .eq('id', offerId)
        .single();
      
      if (error || !data) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }
      
      offerData = data;
      
      // Get the latest transaction for this offer
      const { data: txData, error: txError } = await supabase
        .from('jetshare_transactions')
        .select('*')
        .eq('offer_id', offerId)
        .order('transaction_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!txError && txData) {
        transactionData = txData;
      }
    }
    
    // Validate that the user is authorized to access this boarding pass
    if (user && transactionData && 
        transactionData.payer_user_id !== user.id && 
        transactionData.recipient_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this boarding pass' }, { status: 403 });
    }
    
    // Get user details to include in the boarding pass
    let userData = null;
    if (user) {
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!userError && userProfile) {
        userData = userProfile;
      }
    }
    
    // Generate flight number based on offer ID
    const offerIdStr = offerData.id.toString();
    const flightNumber = `JS${offerIdStr.substring(offerIdStr.length - 4).toUpperCase()}`;
    
    // Generate a pseudo-random gate and seat based on the offer ID
    const hash = offerData.id.split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const gate = `G${Math.abs(hash % 30) + 1}`;
    const seatRow = Math.abs((hash >> 4) % 20) + 1;
    const seatLetter = String.fromCharCode(65 + Math.abs((hash >> 8) % 6)); // A-F
    const seat = `${seatRow}${seatLetter}`;
    
    // Prepare boarding pass data
    const boardingPass = {
      id: `bp-${offerData.id}`,
      transactionId: transactionData?.id,
      offerId: offerData.id,
      flightNumber,
      departureLocation: offerData.departure_location,
      arrivalLocation: offerData.arrival_location,
      departureTime: offerData.flight_date, // This should be a full datetime in production
      arrivalTime: new Date(new Date(offerData.flight_date).getTime() + 10800000).toISOString(), // Estimated +3 hours
      passengerName: userData ? `${userData.first_name} ${userData.last_name}` : (user?.email || 'Guest'),
      gate,
      seat,
      boardingTime: new Date(new Date(offerData.flight_date).getTime() - 3600000).toISOString(), // 1 hour before departure
      status: 'CONFIRMED',
      barcode: `JSBP${offerData.id}${Date.now().toString().substring(0, 6)}`,
    };
    
    if (format === 'wallet') {
      // Return a wallet pass JSON structure - in a real app, this would generate a .pkpass file
      return NextResponse.json({
        success: true,
        message: 'Boarding pass generated for Apple Wallet',
        walletUrl: `/api/jetshare/appleWallet?id=${transactionData?.id || offerData.id}&timestamp=${Date.now()}`,
        boardingPass
      });
    } else {
      // Return a URL for downloading the boarding pass
      return NextResponse.json({
        success: true,
        message: 'Boarding pass generated successfully',
        downloadUrl: `/api/jetshare/mockBoardingPass?id=${transactionData?.id || offerData.id}&timestamp=${Date.now()}`,
        boardingPass
      });
    }
    
  } catch (error) {
    console.error('Error generating boarding pass:', error);
    return NextResponse.json(
      { error: 'Failed to generate boarding pass', message: (error as Error).message },
      { status: 500 }
    );
  }
} 