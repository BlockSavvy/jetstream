// Define JetShare offer status types
export type JetShareOfferStatus = 'open' | 'accepted' | 'completed';

// Define JetShare payment method types
export type JetSharePaymentMethod = 'fiat' | 'crypto';

// Define JetShare payment status types
export type JetSharePaymentStatus = 'pending' | 'completed' | 'failed';

// Define JetShare offer type
export interface JetShareOffer {
  id: string;
  user_id: string;
  flight_date: string;
  departure_location: string;
  arrival_location: string;
  total_flight_cost: number;
  requested_share_amount: number;
  status: JetShareOfferStatus;
  matched_user_id?: string;
  aircraft_model?: string;
  total_seats?: number;
  available_seats?: number;
  created_at: string;
  updated_at: string;
  split_configuration?: {
    jetId: string;
    splitOrientation: 'horizontal' | 'vertical';
    splitRatio: string;
    splitPercentage?: number;
    allocatedSeats: {
      front?: string[];
      back?: string[];
      left?: string[];
      right?: string[];
    };
  };
}

// Define JetShare transaction type
export interface JetShareTransaction {
  id: string;
  offer_id: string;
  payer_user_id: string;
  recipient_user_id: string;
  amount: number;
  handling_fee: number;
  payment_method: JetSharePaymentMethod;
  payment_status: JetSharePaymentStatus;
  transaction_date: string;
  transaction_reference?: string;
  receipt_url?: string;
}

// Define JetShare settings type
export interface JetShareSettings {
  id: string;
  handling_fee_percentage: number;
  allow_crypto_payments: boolean;
  allow_fiat_payments: boolean;
  created_at: string;
  updated_at: string;
}

// Define input types for API requests
export interface CreateJetShareOfferInput {
  flight_date: string;
  departure_location: string;
  arrival_location: string;
  total_flight_cost: number;
  requested_share_amount: number;
  aircraft_model?: string;
  total_seats?: number;
  available_seats?: number;
}

export interface AcceptJetShareOfferInput {
  offer_id: string;
  payment_method: 'fiat' | 'crypto';
}

export interface LogJetShareTransactionInput {
  offer_id: string;
  amount: number;
  payment_method: JetSharePaymentMethod;
  payment_status: JetSharePaymentStatus;
  transaction_reference?: string;
}

// Define JetShare offer with user details
export interface JetShareOfferWithUser extends JetShareOffer {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
  matched_user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// Define JetShare transaction with offer and user details
export interface JetShareTransactionWithDetails extends JetShareTransaction {
  offer: JetShareOfferWithUser;
  // The current user viewing the transaction
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
  // Fields for recipient and payer with profile info
  payer_user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
  recipient_user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
  // These fields are maintained for backwards compatibility
  payer: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
  recipient: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// Define JetShare stats type
export interface JetShareStatsData {
  offerCount: number;
  acceptedCount: number;
  completedCount: number;
  totalSaved: number;
}

// Define Stripe Payment Intent response
export interface StripePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Define Coinbase Checkout response
export interface CoinbaseCheckoutResponse {
  checkoutId: string;
  checkoutUrl: string;
  expiresAt: string;
} 