import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  JetShareOfferStatus, 
  JetSharePaymentStatus,
  isValidOfferStatusTransition,
  isValidPaymentStatusTransition
} from '../types';

// Define transition options interface
interface TransitionOfferStatusOptions {
  offerId: string;
  newStatus: JetShareOfferStatus;
  userId?: string;
  paymentId?: string;
  metadata?: Record<string, any>;
  sendNotification?: boolean;
}

/**
 * Transition an offer from one status to another with validation
 */
export async function transitionOfferStatus({
  offerId,
  newStatus,
  userId,
  paymentId,
  metadata = {},
  sendNotification = true
}: TransitionOfferStatusOptions): Promise<{
  success: boolean;
  message: string;
  offer?: any;
  error?: any;
}> {
  const supabase = createClientComponentClient();
  
  try {
    // 1. Get current offer state
    const { data: offer, error: fetchError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (fetchError || !offer) {
      return {
        success: false,
        message: `Failed to find offer: ${fetchError?.message || 'Offer not found'}`,
        error: fetchError
      };
    }
    
    // 2. Validate the transition
    const currentStatus = offer.status as JetShareOfferStatus;
    if (!isValidOfferStatusTransition(currentStatus, newStatus)) {
      return {
        success: false,
        message: `Invalid transition from ${currentStatus} to ${newStatus}`,
        offer
      };
    }
    
    // 3. Prepare update data based on the new status
    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    // Add specific fields based on transition type
    if (newStatus === 'accepted' && currentStatus !== 'accepted') {
      updateData.accepted_at = new Date().toISOString();
      updateData.accepted_by = userId;
      
      // Also update payment status if not already set
      if (offer.payment_status === 'unpaid' || !offer.payment_status) {
        updateData.payment_status = 'payment_pending';
      }
      
      if (paymentId) {
        updateData.payment_id = paymentId;
      }
    }
    
    if (newStatus === 'completed' && currentStatus !== 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    // 4. Update the offer in the database
    const { data: updatedOffer, error: updateError } = await supabase
      .from('jetshare_offers')
      .update(updateData)
      .eq('id', offerId)
      .select('*')
      .single();
      
    if (updateError) {
      return {
        success: false,
        message: `Failed to update offer status: ${updateError.message}`,
        error: updateError,
        offer
      };
    }
    
    // 5. Record transition in audit log if available
    try {
      await supabase.from('jetshare_activity_log').insert({
        offer_id: offerId,
        user_id: userId || offer.user_id,
        action: `status_change_${currentStatus}_to_${newStatus}`,
        metadata: {
          ...metadata,
          previous_status: currentStatus,
          new_status: newStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      // Non-critical error, just log it
      console.error('Failed to record transition in activity log:', logError);
    }
    
    // 6. Send notification if enabled
    if (sendNotification) {
      try {
        // Call notification service (replace with your actual implementation)
        await sendOfferStatusChangeNotification(
          offerId, 
          currentStatus, 
          newStatus, 
          offer.user_id, 
          userId
        );
      } catch (notifError) {
        // Non-critical error, just log it
        console.error('Failed to send status change notification:', notifError);
      }
    }
    
    return {
      success: true,
      message: `Successfully transitioned offer from ${currentStatus} to ${newStatus}`,
      offer: updatedOffer
    };
    
  } catch (error) {
    console.error('Unexpected error in transitionOfferStatus:', error);
    return {
      success: false,
      message: `Unexpected error: ${(error as Error).message}`,
      error
    };
  }
}

/**
 * Transition payment status with validation
 */
export async function transitionPaymentStatus({
  offerId,
  newStatus,
  paymentId,
  userId,
  metadata = {}
}: {
  offerId: string;
  newStatus: JetSharePaymentStatus;
  paymentId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  message: string;
  offer?: any;
  error?: any;
}> {
  const supabase = createClientComponentClient();
  
  try {
    // 1. Get current offer
    const { data: offer, error: fetchError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (fetchError || !offer) {
      return {
        success: false,
        message: `Failed to find offer: ${fetchError?.message || 'Offer not found'}`,
        error: fetchError
      };
    }
    
    // 2. Validate the payment transition
    const currentPaymentStatus = offer.payment_status as JetSharePaymentStatus || 'unpaid';
    if (!isValidPaymentStatusTransition(currentPaymentStatus, newStatus)) {
      return {
        success: false,
        message: `Invalid payment transition from ${currentPaymentStatus} to ${newStatus}`,
        offer
      };
    }
    
    // 3. Prepare update data
    const updateData: Record<string, any> = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (paymentId && !offer.payment_id) {
      updateData.payment_id = paymentId;
    }
    
    // 4. Update offer with new payment status
    const { data: updatedOffer, error: updateError } = await supabase
      .from('jetshare_offers')
      .update(updateData)
      .eq('id', offerId)
      .select('*')
      .single();
      
    if (updateError) {
      return {
        success: false,
        message: `Failed to update payment status: ${updateError.message}`,
        error: updateError,
        offer
      };
    }
    
    // 5. Record in payment transitions log if needed
    try {
      await supabase.from('jetshare_payment_log').insert({
        offer_id: offerId,
        user_id: userId || offer.user_id,
        payment_id: paymentId || offer.payment_id,
        previous_status: currentPaymentStatus,
        new_status: newStatus,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      // Non-critical error, just log it
      console.error('Failed to record payment transition in log:', logError);
    }
    
    return {
      success: true,
      message: `Successfully transitioned payment from ${currentPaymentStatus} to ${newStatus}`,
      offer: updatedOffer
    };
    
  } catch (error) {
    console.error('Unexpected error in transitionPaymentStatus:', error);
    return {
      success: false,
      message: `Unexpected error: ${(error as Error).message}`,
      error
    };
  }
}

// Placeholder for notification function - implement according to your notification system
async function sendOfferStatusChangeNotification(
  offerId: string,
  previousStatus: JetShareOfferStatus,
  newStatus: JetShareOfferStatus,
  offerUserId: string,
  triggerUserId?: string
): Promise<void> {
  // This is a placeholder - implement your actual notification logic
  console.log(`Sending notification for offer ${offerId}: ${previousStatus} -> ${newStatus}`);
  
  // Example implementation:
  // await fetch('/api/notifications/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     type: 'offer_status_change',
  //     user_id: offerUserId,
  //     data: {
  //       offer_id: offerId,
  //       previous_status: previousStatus,
  //       new_status: newStatus,
  //       triggered_by: triggerUserId
  //     }
  //   })
  // });
} 