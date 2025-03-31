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
  
  // First, ensure the user has a profile
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (!userProfile) {
    // Create a basic profile if it doesn't exist
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('User not authenticated');
    
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: 'User',  // These will be updated later
        last_name: String(userId).slice(0, 8),
        user_type: 'traveler',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error creating user profile:', insertError);
      throw new Error('Failed to create user profile');
    }
  }
  
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
  excludeUserId?: string;
  matchedUserId?: string;
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
        avatar_url
      ),
      matched_user:matched_user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `);
  
  // Apply filters
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  // Handle user filtering - either as creator or as matched user
  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }
  
  // Handle matched user filtering
  if (options?.matchedUserId) {
    query = query.eq('matched_user_id', options.matchedUserId);
  }
  
  // Exclude offers from specified user
  if (options?.excludeUserId) {
    query = query.neq('user_id', options.excludeUserId);
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
  supabase: any,
  userId: string,
  offerId: string,
  paymentMethod: 'fiat' | 'crypto'
): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    // First check if the authenticated user is valid
    console.log(`Validating user authentication for user ${userId} accepting offer ${offerId}`);
    
    // Start by checking if we have a valid user session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('Authentication error when accepting offer:', userError || 'No user data found');
      return {
        success: false,
        error: 'Authentication required: ' + (userError?.message || 'User session is invalid')
      };
    }
    
    // Verify the authenticated user matches the provided userId
    if (userData.user.id !== userId) {
      console.error(`Authentication mismatch: provided user ID ${userId} doesn't match authenticated user ${userData.user.id}`);
      return {
        success: false,
        error: 'Authentication error: User ID mismatch'
      };
    }
    
    // Fetch the offer to check status and ownership - with retry
    console.log(`Fetching offer ${offerId} for acceptance by user ${userId}`);
    let offerData;
    let fetchError;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      const result = await supabase
        .from('jetshare_offers')
        .select('id, user_id, status, matched_user_id, requested_share_amount')
        .eq('id', offerId)
        .single();
      
      fetchError = result.error;
      offerData = result.data;
      
      if (!fetchError && offerData) {
        break;
      }
      
      console.warn(`Retry ${retryCount + 1}/${maxRetries} fetching offer ${offerId}`);
      retryCount++;
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
      
    if (fetchError || !offerData) {
      console.error(`Error fetching offer ${offerId} or not found:`, fetchError);
      return {
        success: false,
        error: 'Offer not found or cannot be accessed'
      };
    }
    
    console.log(`Offer details for accepting:`, {
      id: offerData.id,
      status: offerData.status,
      offerUserId: offerData.user_id,
      currentMatchedUserId: offerData.matched_user_id ?? 'none',
      acceptingUserId: userId,
      requestedAmount: offerData.requested_share_amount,
    });

    // Validation checks
    if (offerData.user_id === userId) {
      console.warn(`User ${userId} cannot accept their own offer ${offerId}`);
      return {
        success: false,
        error: 'You cannot accept your own offer'
      };
    }
    
    // Check if offer is already completed
    if (offerData.status === 'completed') {
      console.warn(`Offer ${offerId} is already completed. Cannot accept.`);
      return {
        success: false,
        error: 'This offer has already been completed'
      };
    }
    
    // Check if offer is already accepted by another user
    if (offerData.status === 'accepted' && offerData.matched_user_id && offerData.matched_user_id !== userId) {
      console.warn(`Offer ${offerId} already accepted by user ${offerData.matched_user_id}. Cannot accept.`);
      return {
        success: false,
        error: 'This offer has already been accepted by another user'
      };
    }
    
    // If the offer is already accepted by this user, just return success
    if (offerData.status === 'accepted' && offerData.matched_user_id === userId) {
      console.log(`Offer ${offerId} is already accepted by this user ${userId}. Returning success.`);
      return {
        success: true,
        data: offerData,
        error: 'Offer already accepted. Proceed to payment.'
      };
    }

    // If status is not open, reject (covers cases like 'cancelled')
    if (offerData.status !== 'open' && offerData.status !== 'accepted') {
      console.warn(`Offer ${offerId} is not available (status: ${offerData.status}). Cannot accept.`);
      return {
        success: false,
        error: `Offer is not available (status: ${offerData.status})`
      };
    }

    // Perform the update - with retry mechanism
    retryCount = 0;
    let updatedOffer;
    let updateError;
    
    while (retryCount < maxRetries) {
      console.log(`Attempt ${retryCount + 1}/${maxRetries} to update offer ${offerId}: set status=accepted, matched_user_id=${userId}`);
      
      const result = await supabase
        .from('jetshare_offers')
        .update({
          status: 'accepted',
          matched_user_id: userId,
        })
        .eq('id', offerId)
        .or(`status.eq.open,and(status.eq.accepted,matched_user_id.is.null)`) // Accept if open or if accepted with no matched user
        .select() // Return the updated record
        .single();
      
      updateError = result.error;
      updatedOffer = result.data;
      
      if (!updateError && updatedOffer) {
        break;
      }
      
      console.warn(`Retry ${retryCount + 1}/${maxRetries} updating offer ${offerId} (error: ${updateError?.message || 'unknown'})`);
      retryCount++;
      // Slightly longer delay for update retries
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (updateError || !updatedOffer) {
      console.error(`Failed to update offer ${offerId} to accepted state:`, updateError);
      
      // Check if offer status changed concurrently
      const { data: currentOfferState } = await supabase
        .from('jetshare_offers')
        .select('status, matched_user_id')
        .eq('id', offerId)
        .single();
      
      if (currentOfferState?.matched_user_id && currentOfferState.matched_user_id !== userId) {
        console.warn(`Offer ${offerId} was accepted by another user concurrently.`);
        return { 
          success: false,
          error: 'This offer was accepted by another user in the meantime. Please try a different offer.'
        };
      }
      
      if (currentOfferState?.status !== 'open') {
        console.warn(`Offer ${offerId} changed status concurrently to ${currentOfferState?.status}.`);
        return { 
          success: false,
          error: `Offer status changed to ${currentOfferState?.status || 'unknown'}. Cannot accept.`
        };
      }
      
      return { 
        success: false,
        error: updateError?.message || 'Database error: Unable to update offer status'
      };
    }

    console.log(`Offer ${offerId} updated successfully to accepted state by user ${userId}. Updated data:`, updatedOffer);

    // Return success response with the updated offer data
    return { 
      success: true, 
      data: updatedOffer,
      error: undefined
    };
  } catch (error) {
    console.error('Error in acceptJetShareOffer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
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
  
  console.log('Logging JetShare transaction:', {
    offer_id: data.offer_id,
    amount: data.amount,
    payment_method: data.payment_method || '(not provided)',
    payment_status: data.payment_status || '(not provided)',
    payer: data.payer_user_id,
    recipient: data.recipient_user_id
  });
  
  try {
    // Build transaction object starting with essential fields
    const transaction: any = {
      offer_id: data.offer_id,
      payer_user_id: data.payer_user_id,
      recipient_user_id: data.recipient_user_id,
      amount: data.amount,
      transaction_date: new Date().toISOString(),
    };
    
    // Add optional fields if provided
    if (data.transaction_reference) {
      transaction.transaction_reference = data.transaction_reference;
    }
    
    if (data.payment_status) {
      transaction.payment_status = data.payment_status;
    }
    
    if (data.handling_fee !== undefined) {
      transaction.handling_fee = data.handling_fee;
    }
    
    if (data.payment_method) {
      transaction.payment_method = data.payment_method;
    }
    
    // First attempt to insert with all fields
    console.log('Attempting to insert transaction with all fields');
    const { data: txData, error } = await supabase
      .from('jetshare_transactions')
      .insert(transaction)
      .select()
      .single();
      
    if (error) {
      console.error('Initial error logging transaction:', error);
      
      // If there's a column not found error, try progressively simpler inserts
      if (error.code === '42703' || error.message.includes('column') || error.message.includes('field')) {
        console.log('Database schema issue detected, attempting simplified transaction insert');
        
        // Try without payment_method
        const withoutPaymentMethod = { ...transaction };
        delete withoutPaymentMethod.payment_method;
        
        console.log('Attempting insert without payment_method field');
        const { data: data1, error: error1 } = await supabase
          .from('jetshare_transactions')
          .insert(withoutPaymentMethod)
          .select()
          .single();
          
        if (!error1) {
          console.log('Transaction logged without payment_method:', data1);
          return data1 as JetShareTransaction;
        }
        
        // Try without handling_fee
        const withoutHandlingFee = { ...withoutPaymentMethod };
        delete withoutHandlingFee.handling_fee;
        
        console.log('Attempting insert without payment_method and handling_fee fields');
        const { data: data2, error: error2 } = await supabase
          .from('jetshare_transactions')
          .insert(withoutHandlingFee)
          .select()
          .single();
          
        if (!error2) {
          console.log('Transaction logged without payment_method and handling_fee:', data2);
          return data2 as JetShareTransaction;
        }
        
        // Final attempt with minimal fields
        const minimalTransaction = {
          offer_id: data.offer_id,
          payer_user_id: data.payer_user_id,
          recipient_user_id: data.recipient_user_id,
          amount: data.amount,
          transaction_date: new Date().toISOString(),
        };
        
        console.log('Attempting insert with minimal fields only');
        const { data: minData, error: minError } = await supabase
          .from('jetshare_transactions')
          .insert(minimalTransaction)
          .select()
          .single();
          
        if (minError) {
          console.error('Error on minimal transaction insert:', minError);
          throw new Error(`Failed to log transaction with minimal fields: ${minError.message}`);
        }
        
        console.log('Transaction logged with minimal fields:', minData);
        return minData as JetShareTransaction;
      }
      
      throw new Error(`Failed to log transaction: ${error.message}`);
    }
    
    console.log('Transaction logged successfully:', txData);
    
    // If the payment is completed, update the offer status to completed
    if (data.payment_status === 'completed') {
      const { error: updateError } = await supabase
        .from('jetshare_offers')
        .update({ 
          status: 'completed',
          matched_user_id: data.payer_user_id // Ensure the matched_user_id is set
        })
        .eq('id', data.offer_id);
        
      if (updateError) {
        console.error(`Error updating offer status to completed:`, updateError);
      } else {
        console.log(`Updated offer ${data.offer_id} status to completed`);
      }
        
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
  } catch (error) {
    console.error('Transaction logging failed:', error);
    
    // If transaction logging fails, we still want to update the offer
    // This ensures user can complete a booking even if transaction logging fails
    if (data.payment_status === 'completed') {
      try {
        const { error: updateError } = await supabase
          .from('jetshare_offers')
          .update({ 
            status: 'completed',
            matched_user_id: data.payer_user_id // Ensure the matched_user_id is set
          })
          .eq('id', data.offer_id);
          
        if (updateError) {
          console.error('Error updating offer after transaction failure:', updateError);
        } else {
          console.log(`Updated offer ${data.offer_id} status to completed despite transaction logging failure`);
        }
      } catch (updateError) {
        console.error('Failed to update offer after transaction failure:', updateError);
      }
    }
    
    // Return a minimal transaction object so the payment flow can continue
    return {
      id: 'error-fallback',
      offer_id: data.offer_id,
      payer_user_id: data.payer_user_id,
      recipient_user_id: data.recipient_user_id,
      amount: data.amount,
      handling_fee: data.handling_fee,
      payment_method: data.payment_method || 'fiat',
      payment_status: data.payment_status || 'completed',
      transaction_date: new Date().toISOString(),
      transaction_reference: data.transaction_reference || 'error-fallback'
    } as JetShareTransaction;
  }
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
        user:user_id (*),
        matched_user:matched_user_id (*)
      ),
      payer:payer_user_id (*),
      recipient:recipient_user_id (*)
    `);
  
  // Add filter for user as either payer or recipient 
  query = query.or(`payer_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
  
  // Filter by offer if provided
  if (options?.offerId) {
    query = query.eq('offer_id', options.offerId);
  }
  
  // Add order by transaction date (most recent first)
  query = query.order('transaction_date', { ascending: false });
  
  // Add pagination
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
  
  // Enhance transaction data with additional user information
  const enhancedData = data.map(transaction => {
    return {
      ...transaction,
      // Add the current user information for comparison in the UI
      user: {
        id: userId
      },
      // Add payer_user and recipient_user fields for convenience in the UI
      payer_user: transaction.payer,
      recipient_user: transaction.recipient
    };
  });
  
  return enhancedData as JetShareTransactionWithDetails[];
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
    .or('payer_user_id.eq.' + userId + ',recipient_user_id.eq.' + userId)
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