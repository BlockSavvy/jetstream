export type JetShareOfferStatus = 'open' | 'pending' | 'accepted' | 'completed' | 'cancelled';
export type JetSharePaymentStatus = 'unpaid' | 'payment_pending' | 'paid' | 'refunded';
export type JetSharePaymentMethod = 'card' | 'bank_transfer' | 'crypto' | 'wallet';

export interface JetShareOffer {
  id: string;
  user_id: string;
  flight_date: string;
  departure_time: string;
  departure_location: string;
  arrival_location: string;
  aircraft_model: string;
  jet_id: string | null;
  total_seats: number;
  available_seats: number;
  total_flight_cost: number;
  requested_share_amount: number;
  split_configuration: any;
  status: JetShareOfferStatus;
  payment_status: JetSharePaymentStatus;
  created_at: string;
  updated_at: string;
  accepted_by?: string | null;
  accepted_at?: string | null;
  completed_at?: string | null;
  payment_id?: string | null;
  payment_method?: JetSharePaymentMethod | null;
  transaction_id?: string | null;
}

export interface JetShareTransaction {
  id: string;
  offer_id: string;
  payment_id: string;
  user_id: string;
  amount: number;
  payment_method: JetSharePaymentMethod;
  status: JetSharePaymentStatus;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Helper functions for state transitions
export const isValidOfferStatusTransition = (
  currentStatus: JetShareOfferStatus,
  newStatus: JetShareOfferStatus
): boolean => {
  // Define valid state transitions
  const validTransitions: Record<JetShareOfferStatus, JetShareOfferStatus[]> = {
    'open': ['pending', 'cancelled'],
    'pending': ['open', 'accepted', 'cancelled'],
    'accepted': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': ['open'] // Can reopen a cancelled offer
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

export const isValidPaymentStatusTransition = (
  currentStatus: JetSharePaymentStatus,
  newStatus: JetSharePaymentStatus
): boolean => {
  // Define valid payment state transitions
  const validTransitions: Record<JetSharePaymentStatus, JetSharePaymentStatus[]> = {
    'unpaid': ['payment_pending', 'paid'],
    'payment_pending': ['paid', 'unpaid', 'refunded'],
    'paid': ['refunded'],
    'refunded': [] // Terminal state
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Get display name for status
export const getOfferStatusDisplay = (status: JetShareOfferStatus): string => {
  const displayNames: Record<JetShareOfferStatus, string> = {
    'open': 'Open',
    'pending': 'Pending Acceptance',
    'accepted': 'Accepted',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  return displayNames[status] || status;
};

export const getPaymentStatusDisplay = (status: JetSharePaymentStatus): string => {
  const displayNames: Record<JetSharePaymentStatus, string> = {
    'unpaid': 'Unpaid',
    'payment_pending': 'Payment Pending',
    'paid': 'Paid',
    'refunded': 'Refunded'
  };
  
  return displayNames[status] || status;
};

// Get CSS class name for status
export const getOfferStatusClassName = (status: JetShareOfferStatus): string => {
  const classNames: Record<JetShareOfferStatus, string> = {
    'open': 'offer-status-open',
    'pending': 'offer-status-pending',
    'accepted': 'offer-status-accepted',
    'completed': 'offer-status-completed',
    'cancelled': 'offer-status-cancelled'
  };
  
  return classNames[status] || '';
};

export const getPaymentStatusClassName = (status: JetSharePaymentStatus): string => {
  const classNames: Record<JetSharePaymentStatus, string> = {
    'unpaid': 'payment-status-unpaid',
    'payment_pending': 'payment-status-pending',
    'paid': 'payment-status-paid',
    'refunded': 'payment-status-refunded'
  };
  
  return classNames[status] || '';
}; 