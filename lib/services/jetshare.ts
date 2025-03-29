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
  userId: string,
  offerData: AcceptJetShareOfferInput
): Promise<JetShareOfferWithUser> {
  const supabase = await createClient();
  
  console.log('Accepting offer:', offerData.offer_id, 'by user:', userId);
  
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

  // Update the offer checking logic in acceptJetShareOffer
  // Before checking if the offer exists and is still open
  console.log('Checking if offer exists and checking its status...');

  // First check if the offer exists at all, regardless of status
  const { data: existingOffer, error: existingOfferError } = await supabase
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
    .single();
    
  if (existingOfferError) {
    console.error('Error fetching any JetShare offer:', existingOfferError);
    throw new Error(`Offer not found: ${existingOfferError.message}`);
  }

  if (!existingOffer) {
    console.error('No offer found with ID:', offerData.offer_id);
    throw new Error('Offer not found');
  }

  // Additional logging for debugging
  console.log('Found offer with status:', existingOffer.status, 'matched_user_id:', existingOffer.matched_user_id || 'none');

  // Check if the user is trying to accept their own offer
  if (existingOffer.user_id === userId) {
    console.error('User trying to accept their own offer:', userId);
    throw new Error('You cannot accept your own offer');
  }

  // Check if the offer is already completed
  if (existingOffer.status === 'completed') {
    console.error('Offer is already completed:', existingOffer.id);
    throw new Error('This offer has already been completed and is no longer available');
  }

  // Check if the offer is already accepted by another user
  if (existingOffer.status === 'accepted' && existingOffer.matched_user_id && existingOffer.matched_user_id !== userId) {
    console.error('Offer already accepted by another user:', existingOffer.matched_user_id);
    throw new Error('Offer has already been accepted by another user');
  }

  // If the offer is already accepted by this user, return it without an error
  if (existingOffer.status === 'accepted' && existingOffer.matched_user_id === userId) {
    console.log('Offer already accepted by this user:', userId);
    
    // Re-fetch with full relations to ensure we have all data
    const { data: alreadyAcceptedOffer, error: fetchError } = await supabase
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
      .eq('id', offerData.offer_id)
      .single();
      
    if (fetchError || !alreadyAcceptedOffer) {
      console.error('Error fetching already accepted offer with relations:', fetchError);
      throw new Error('Failed to fetch offer details');
    }
    
    return alreadyAcceptedOffer as JetShareOfferWithUser;
  }

  // Now proceed with the standard flow for an open offer
  // But only if we're really still dealing with an open offer
  if (existingOffer.status !== 'open') {
    console.error('Offer is in an unexpected state:', existingOffer.status);
    throw new Error(`Offer is in an invalid state: ${existingOffer.status}`);
  }

  // Continue with the original open offer check and update
  console.log('Proceeding with standard open offer update to accepted state...');
  
  // Update the offer
  console.log('Updating offer status to accepted...');
  
  // First try to update with status check
  const updateResult = await supabase
    .from('jetshare_offers')
    .update({
      status: 'accepted',
      matched_user_id: userId,
      updated_at: new Date().toISOString() // Add timestamp to force update
    })
    .eq('id', offerData.offer_id)
    .eq('status', 'open');
    
  // Check for update errors
  if (updateResult.error) {
    console.error('Error updating JetShare offer:', updateResult.error);
    console.log('Update failed for offer ID:', offerData.offer_id, 'Status:', 'open');
    
    // Let's check if the offer exists at all
    const { data: checkOffer, error: checkError } = await supabase
      .from('jetshare_offers')
      .select('status, matched_user_id')
      .eq('id', offerData.offer_id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking offer existence:', checkError);
      throw new Error(`Failed to verify offer: ${checkError.message}`);
    }
    
    if (!checkOffer) {
      console.error('Offer does not exist:', offerData.offer_id);
      throw new Error('Offer not found');
    }
    
    // If offer exists but status is already accepted/completed
    if (checkOffer.status === 'accepted' || checkOffer.status === 'completed') {
      console.error('Offer already accepted or completed:', checkOffer.status);
      throw new Error(`Offer is no longer available. Current status: ${checkOffer.status}`);
    }
    
    // If it exists but couldn't be updated due to other reasons
    throw new Error(`Failed to update offer status: ${updateResult.error.message}`);
  }
  
  // Check if the update affected any rows
  if (updateResult.count === 0) {
    console.error('No rows were updated. Offer might have been accepted by someone else already.');
    
    // Double-check the current status
    const { data: statusCheck, error: statusError } = await supabase
      .from('jetshare_offers')
      .select('status, matched_user_id')
      .eq('id', offerData.offer_id)
      .maybeSingle();
      
    if (statusError) {
      console.error('Error checking offer status after failed update:', statusError);
      throw new Error('Failed to verify offer status');
    }
    
    if (!statusCheck) {
      console.error('Offer not found during status check:', offerData.offer_id);
      throw new Error('Offer no longer exists');
    }
    
    // If the offer is already accepted by this user, we can proceed
    if (statusCheck.status === 'accepted' && statusCheck.matched_user_id === userId) {
      console.log('Offer is already accepted by this user, proceeding');
    } else if (statusCheck.status === 'accepted') {
      console.error('Offer already accepted by another user:', statusCheck.matched_user_id);
      throw new Error('Offer has already been accepted by another user');
    } else if (statusCheck.status === 'completed') {
      console.error('Offer already completed');
      throw new Error('Offer has already been completed and is no longer available');
    } else {
      // Status is still 'open' but update failed - try a force update without status check
      console.log('Attempting force update without status check...');
      
      const forceResult = await supabase
        .from('jetshare_offers')
        .update({
          status: 'accepted',
          matched_user_id: userId,
          updated_at: new Date().toISOString() // Add timestamp to force update
        })
        .eq('id', offerData.offer_id);
        
      if (forceResult.error) {
        console.error('Force update failed:', forceResult.error);
        throw new Error(`Failed to update offer status even with force update: ${forceResult.error.message}`);
      }
      
      if (forceResult.count === 0) {
        console.error('Force update affected 0 rows');
        throw new Error('Failed to update offer status despite multiple attempts. The offer might have been modified or removed.');
      }
      
      console.log('Force update succeeded, affected rows:', forceResult.count);
    }
  }
  
  console.log('Offer updated successfully to accepted state');
  
  // Only if update was successful, fetch the updated offer with all relations
  const { data: updatedOffer, error: fetchError } = await supabase
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
    .eq('id', offerData.offer_id)
    .single();
    
  if (fetchError || !updatedOffer) {
    console.error('Error fetching updated JetShare offer:', fetchError);
    throw new Error('Offer status was updated, but failed to fetch the updated offer details');
  }
  
  // Send notification to the offer creator
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', updatedOffer.user_id)
    .single();
    
  if (userData?.email) {
    try {
      await sendEmail(
        userData.email,
        'Your JetShare Offer Has Been Accepted',
        `Your flight share offer from ${updatedOffer.departure_location} to ${updatedOffer.arrival_location} on ${new Date(updatedOffer.flight_date).toLocaleDateString()} has been accepted. The requested share amount of $${updatedOffer.requested_share_amount} will be transferred to your account once payment is completed.`
      );
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }
  }
  
  if (userData?.phone) {
    try {
      await sendSMS(
        userData.phone,
        `Your JetShare offer for flight from ${updatedOffer.departure_location} to ${updatedOffer.arrival_location} has been accepted. Amount: $${updatedOffer.requested_share_amount}.`
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