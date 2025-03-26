import { createClient } from '@/lib/supabase-server';
import { 
  JetShareOffer, 
  JetShareTransaction,
  JetShareSettings,
  JetShareOfferWithUser,
  JetShareTransactionWithDetails,
  CreateJetShareOfferInput,
  AcceptJetShareOfferInput,
  LogJetShareTransactionInput
} from '@/types/jetshare';
import { sendEmail } from './email';
import { sendSMS } from './sms';

/**
 * Get JetShare settings
 */
export async function getJetShareSettings(): Promise<JetShareSettings> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('jetshare_settings')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();
    
  if (error) {
    console.error('Error fetching JetShare settings:', error);
    throw new Error('Failed to fetch JetShare settings');
  }
  
  return data;
}

/**
 * Create a new JetShare offer
 */
export async function createJetShareOffer(
  userId: string,
  offerData: CreateJetShareOfferInput
): Promise<JetShareOffer> {
  const supabase = await createClient();
  
  const offer = {
    user_id: userId,
    flight_date: offerData.flight_date,
    departure_location: offerData.departure_location,
    arrival_location: offerData.arrival_location,
    total_flight_cost: offerData.total_flight_cost,
    requested_share_amount: offerData.requested_share_amount,
    status: 'open' as const,
  };
  
  const { data, error } = await supabase
    .from('jetshare_offers')
    .insert(offer)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating JetShare offer:', error);
    throw new Error('Failed to create JetShare offer');
  }
  
  // Fetch user information for notification
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .single();
    
  if (userData?.email) {
    try {
      await sendEmail(
        userData.email,
        'Your JetShare Offer Has Been Created',
        `Your flight share offer from ${offerData.departure_location} to ${offerData.arrival_location} on ${new Date(offerData.flight_date).toLocaleDateString()} has been created with a requested share amount of $${offerData.requested_share_amount}. You'll be notified when someone accepts your offer.`
      );
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }
  }
  
  if (userData?.phone) {
    try {
      await sendSMS(
        userData.phone,
        `Your JetShare offer for flight from ${offerData.departure_location} to ${offerData.arrival_location} has been created successfully. Requested share amount: $${offerData.requested_share_amount}.`
      );
    } catch (smsError) {
      console.error('Error sending SMS notification:', smsError);
    }
  }
  
  return data;
}

/**
 * Get JetShare offers with filters
 */
export async function getJetShareOffers(options?: {
  status?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  departureLocation?: string;
  arrivalLocation?: string;
  startDate?: string;
  endDate?: string;
}): Promise<JetShareOfferWithUser[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      ),
      matched_user:matched_user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `);
  
  // Apply filters
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.userId) {
    if (options.userId === 'current') {
      // Will be replaced by the actual user ID in the API route
      // Here we just need a placeholder
      query = query.eq('user_id', 'current_user_id');
    } else {
      query = query.or(`user_id.eq.${options.userId},matched_user_id.eq.${options.userId}`);
    }
  }
  
  if (options?.departureLocation) {
    query = query.ilike('departure_location', `%${options.departureLocation}%`);
  }
  
  if (options?.arrivalLocation) {
    query = query.ilike('arrival_location', `%${options.arrivalLocation}%`);
  }
  
  if (options?.startDate) {
    query = query.gte('flight_date', options.startDate);
  }
  
  if (options?.endDate) {
    query = query.lte('flight_date', options.endDate);
  }
  
  // Order by flight date (upcoming first)
  query = query.order('flight_date', { ascending: true });
  
  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching JetShare offers:', error);
    throw new Error('Failed to fetch JetShare offers');
  }
  
  return data as JetShareOfferWithUser[];
}

/**
 * Get a single JetShare offer by ID
 */
export async function getJetShareOfferById(offerId: string): Promise<JetShareOfferWithUser> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      ),
      matched_user:matched_user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('id', offerId)
    .single();
    
  if (error) {
    console.error('Error fetching JetShare offer:', error);
    throw new Error('Failed to fetch JetShare offer');
  }
  
  return data as JetShareOfferWithUser;
}

/**
 * Accept a JetShare offer
 */
export async function acceptJetShareOffer(
  userId: string,
  offerData: AcceptJetShareOfferInput
): Promise<JetShareOfferWithUser> {
  const supabase = await createClient();
  
  // First, check if the offer exists and is still open
  const { data: offer, error: offerError } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('id', offerData.offer_id)
    .eq('status', 'open')
    .single();
    
  if (offerError || !offer) {
    console.error('Error fetching JetShare offer:', offerError);
    throw new Error('Offer not found or not available');
  }
  
  // Check if the user is trying to accept their own offer
  if (offer.user_id === userId) {
    throw new Error('You cannot accept your own offer');
  }
  
  // Update the offer
  const { data: updatedOffer, error: updateError } = await supabase
    .from('jetshare_offers')
    .update({
      status: 'accepted',
      matched_user_id: userId,
    })
    .eq('id', offerData.offer_id)
    .eq('status', 'open')
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      ),
      matched_user:matched_user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .single();
    
  if (updateError || !updatedOffer) {
    console.error('Error accepting JetShare offer:', updateError);
    throw new Error('Failed to accept offer');
  }
  
  // Send notification to the offer creator
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', offer.user_id)
    .single();
    
  if (userData?.email) {
    try {
      await sendEmail(
        userData.email,
        'Your JetShare Offer Has Been Accepted',
        `Your flight share offer from ${offer.departure_location} to ${offer.arrival_location} on ${new Date(offer.flight_date).toLocaleDateString()} has been accepted. The requested share amount of $${offer.requested_share_amount} will be transferred to your account once payment is completed.`
      );
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }
  }
  
  if (userData?.phone) {
    try {
      await sendSMS(
        userData.phone,
        `Your JetShare offer for flight from ${offer.departure_location} to ${offer.arrival_location} has been accepted. Amount: $${offer.requested_share_amount}.`
      );
    } catch (smsError) {
      console.error('Error sending SMS notification:', smsError);
    }
  }
  
  return updatedOffer as JetShareOfferWithUser;
}

/**
 * Log a JetShare transaction
 */
export async function logJetShareTransaction(
  data: LogJetShareTransactionInput & {
    payer_user_id: string;
    recipient_user_id: string;
    handling_fee: number;
  }
): Promise<JetShareTransaction> {
  const supabase = await createClient();
  
  const transaction = {
    offer_id: data.offer_id,
    payer_user_id: data.payer_user_id,
    recipient_user_id: data.recipient_user_id,
    amount: data.amount,
    handling_fee: data.handling_fee,
    payment_method: data.payment_method,
    payment_status: data.payment_status,
    transaction_reference: data.transaction_reference,
    transaction_date: new Date().toISOString(),
  };
  
  const { data: txData, error } = await supabase
    .from('jetshare_transactions')
    .insert(transaction)
    .select()
    .single();
    
  if (error) {
    console.error('Error logging JetShare transaction:', error);
    throw new Error('Failed to log transaction');
  }
  
  // If the payment is completed, update the offer status to completed
  if (data.payment_status === 'completed') {
    await supabase
      .from('jetshare_offers')
      .update({ status: 'completed' })
      .eq('id', data.offer_id);
      
    // Send payment notification to both users
    const usersToNotify = [data.payer_user_id, data.recipient_user_id];
    
    for (const userId of usersToNotify) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('id', userId)
        .single();
        
      if (userData?.email) {
        try {
          await sendEmail(
            userData.email,
            'JetShare Payment Completed',
            `Your JetShare payment of $${data.amount} has been completed successfully using ${data.payment_method === 'fiat' ? 'credit card' : 'cryptocurrency'}. Transaction reference: ${data.transaction_reference || 'N/A'}.`
          );
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      }
      
      if (userData?.phone) {
        try {
          await sendSMS(
            userData.phone,
            `Your JetShare payment of $${data.amount} has been completed. Method: ${data.payment_method === 'fiat' ? 'Credit Card' : 'Cryptocurrency'}.`
          );
        } catch (smsError) {
          console.error('Error sending SMS notification:', smsError);
        }
      }
    }
  }
  
  return txData;
}

/**
 * Calculate handling fee for a transaction
 */
export async function calculateHandlingFee(amount: number): Promise<number> {
  const settings = await getJetShareSettings();
  return Number((amount * (settings.handling_fee_percentage / 100)).toFixed(2));
}

/**
 * Get JetShare transactions for a user
 */
export async function getJetShareTransactions(
  userId: string,
  options?: {
    offerId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<JetShareTransactionWithDetails[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('jetshare_transactions')
    .select(`
      *,
      offer:offer_id (
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        matched_user:matched_user_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      ),
      payer:payer_user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      ),
      recipient:recipient_user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .or(`payer_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
  
  if (options?.offerId) {
    query = query.eq('offer_id', options.offerId);
  }
  
  // Order by transaction date (latest first)
  query = query.order('transaction_date', { ascending: false });
  
  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching JetShare transactions:', error);
    throw new Error('Failed to fetch JetShare transactions');
  }
  
  return data as JetShareTransactionWithDetails[];
}

/**
 * Get JetShare bookings for a user (flights they have matched with)
 */
export async function getJetShareBookings(
  userId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<JetShareOfferWithUser[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      ),
      matched_user:matched_user_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('matched_user_id', userId);
  
  // Apply filters
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  // Order by flight date (upcoming first)
  query = query.order('flight_date', { ascending: true });
  
  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching JetShare bookings:', error);
    throw new Error('Failed to fetch JetShare bookings');
  }
  
  return data as JetShareOfferWithUser[];
}

/**
 * Cancel a JetShare offer
 */
export async function cancelJetShareOffer(
  userId: string,
  offerId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  
  // First, check if the offer exists and belongs to the user
  const { data: offer, error: offerError } = await supabase
    .from('jetshare_offers')
    .select('*')
    .eq('id', offerId)
    .eq('user_id', userId)
    .eq('status', 'open')
    .single();
    
  if (offerError || !offer) {
    console.error('Error fetching JetShare offer:', offerError);
    throw new Error('Offer not found or cannot be cancelled');
  }
  
  // Update the offer status to cancelled
  const { error } = await supabase
    .from('jetshare_offers')
    .delete()
    .eq('id', offerId)
    .eq('user_id', userId)
    .eq('status', 'open');
    
  if (error) {
    console.error('Error cancelling JetShare offer:', error);
    throw new Error('Failed to cancel JetShare offer');
  }
  
  return { success: true };
}

/**
 * Get user's JetShare statistics
 */
export async function getUserJetShareStats(userId: string): Promise<{
  offerCount: number;
  acceptedCount: number;
  completedCount: number;
  totalSaved: number;
}> {
  const supabase = await createClient();
  
  // Get offers by status
  const { data: userOffers, error: offersError } = await supabase
    .from('jetshare_offers')
    .select('status')
    .eq('user_id', userId);
    
  if (offersError) {
    console.error('Error fetching offer counts:', offersError);
    throw new Error('Failed to fetch user statistics');
  }
  
  // Get offers where user is the matched user
  const { data: matchedOffers, error: matchedError } = await supabase
    .from('jetshare_offers')
    .select('status')
    .eq('matched_user_id', userId);
    
  if (matchedError) {
    console.error('Error fetching accepted counts:', matchedError);
    throw new Error('Failed to fetch user statistics');
  }
  
  // Get total amount saved from completed transactions
  const { data: transactions, error: transactionsError } = await supabase
    .from('jetshare_transactions')
    .select('amount')
    .or(`payer_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .eq('payment_status', 'completed');
    
  if (transactionsError) {
    console.error('Error fetching transaction totals:', transactionsError);
    throw new Error('Failed to fetch user statistics');
  }
  
  // Calculate the statistics
  const offerCount = userOffers.filter(offer => offer.status === 'open').length;
  const acceptedCount = 
    userOffers.filter(offer => offer.status === 'accepted').length + 
    matchedOffers.filter(offer => offer.status === 'accepted').length;
  const completedCount = 
    userOffers.filter(offer => offer.status === 'completed').length + 
    matchedOffers.filter(offer => offer.status === 'completed').length;
  
  const totalSaved = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  
  return {
    offerCount,
    acceptedCount,
    completedCount,
    totalSaved
  };
} 