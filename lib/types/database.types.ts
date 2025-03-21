export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          avatar_url: string | null
          bio: string | null
          preferences: Json | null
          user_type: 'traveler' | 'owner' | 'admin'
          verification_status: 'pending' | 'verified' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          avatar_url?: string | null
          bio?: string | null
          preferences?: Json | null
          user_type: 'traveler' | 'owner' | 'admin'
          verification_status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          avatar_url?: string | null
          bio?: string | null
          preferences?: Json | null
          user_type?: 'traveler' | 'owner' | 'admin'
          verification_status?: 'pending' | 'verified' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      jets: {
        Row: {
          id: string
          owner_id: string | null
          model: string
          manufacturer: string
          year: number
          tail_number: string
          capacity: number
          range_nm: number
          images: string[] | null
          amenities: Json | null
          home_base_airport: string
          status: 'available' | 'maintenance' | 'unavailable'
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          model: string
          manufacturer: string
          year: number
          tail_number: string
          capacity: number
          range_nm: number
          images?: string[] | null
          amenities?: Json | null
          home_base_airport: string
          status?: 'available' | 'maintenance' | 'unavailable'
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          model?: string
          manufacturer?: string
          year?: number
          tail_number?: string
          capacity?: number
          range_nm?: number
          images?: string[] | null
          amenities?: Json | null
          home_base_airport?: string
          status?: 'available' | 'maintenance' | 'unavailable'
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      airports: {
        Row: {
          code: string
          name: string
          city: string
          country: string
          location: unknown | null
          is_private: boolean | null
        }
        Insert: {
          code: string
          name: string
          city: string
          country: string
          location?: unknown | null
          is_private?: boolean | null
        }
        Update: {
          code?: string
          name?: string
          city?: string
          country?: string
          location?: unknown | null
          is_private?: boolean | null
        }
      }
      flights: {
        Row: {
          id: string
          jet_id: string
          origin_airport: string | null
          destination_airport: string | null
          departure_time: string
          arrival_time: string
          available_seats: number
          base_price: number
          status: 'scheduled' | 'boarding' | 'in_air' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          jet_id: string
          origin_airport?: string | null
          destination_airport?: string | null
          departure_time: string
          arrival_time: string
          available_seats: number
          base_price: number
          status?: 'scheduled' | 'boarding' | 'in_air' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          jet_id?: string
          origin_airport?: string | null
          destination_airport?: string | null
          departure_time?: string
          arrival_time?: string
          available_seats?: number
          base_price?: number
          status?: 'scheduled' | 'boarding' | 'in_air' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string | null
          flight_id: string
          seats_booked: number
          booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_price: number
          payment_status: 'pending' | 'paid' | 'refunded'
          payment_id: string | null
          ticket_code: string | null
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          flight_id: string
          seats_booked?: number
          booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_price: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          payment_id?: string | null
          ticket_code?: string | null
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          flight_id?: string
          seats_booked?: number
          booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_price?: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          payment_id?: string | null
          ticket_code?: string | null
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fractional_tokens: {
        Row: {
          id: string
          jet_id: string
          owner_id: string | null
          token_percentage: number
          token_value: number
          purchase_date: string
          status: 'active' | 'for_sale' | 'transferred'
          blockchain_address: string | null
          contract_details: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          jet_id: string
          owner_id?: string | null
          token_percentage: number
          token_value: number
          purchase_date?: string
          status?: 'active' | 'for_sale' | 'transferred'
          blockchain_address?: string | null
          contract_details?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          jet_id?: string
          owner_id?: string | null
          token_percentage?: number
          token_value?: number
          purchase_date?: string
          status?: 'active' | 'for_sale' | 'transferred'
          blockchain_address?: string | null
          contract_details?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          flight_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          flight_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          flight_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          user_id: string | null
          amount: number
          currency: string
          payment_method: string
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id: string | null
          payment_details: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id?: string | null
          amount: number
          currency?: string
          payment_method: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          payment_details?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string | null
          amount?: number
          currency?: string
          payment_method?: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          payment_details?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 