-- JETSTREAM DATABASE RESTORATION SCRIPT - PART 5: TRIGGERS AND FUNCTIONS
-- This script creates all the triggers and functions for the database

-- Create a function to update the modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables
DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_jets_modtime ON jets;
CREATE TRIGGER update_jets_modtime
BEFORE UPDATE ON jets
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_flights_modtime ON flights;
CREATE TRIGGER update_flights_modtime
BEFORE UPDATE ON flights
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_bookings_modtime ON bookings;
CREATE TRIGGER update_bookings_modtime
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_fractional_tokens_modtime ON fractional_tokens;
CREATE TRIGGER update_fractional_tokens_modtime
BEFORE UPDATE ON fractional_tokens
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_payments_modtime ON payments;
CREATE TRIGGER update_payments_modtime
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_pilots_crews_modtime ON pilots_crews;
CREATE TRIGGER update_pilots_crews_modtime
BEFORE UPDATE ON pilots_crews
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_specialized_flights_modtime ON specialized_flights;
CREATE TRIGGER update_specialized_flights_modtime
BEFORE UPDATE ON specialized_flights
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_custom_itinerary_requests_modtime ON custom_itinerary_requests;
CREATE TRIGGER update_custom_itinerary_requests_modtime
BEFORE UPDATE ON custom_itinerary_requests
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_jetshare_offers_modtime ON "jetshare_offers";
CREATE TRIGGER update_jetshare_offers_modtime
BEFORE UPDATE ON "jetshare_offers"
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_jetshare_settings_modtime ON "jetshare_settings";
CREATE TRIGGER update_jetshare_settings_modtime
BEFORE UPDATE ON "jetshare_settings"
FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 