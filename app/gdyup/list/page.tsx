'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Users, Plane, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ElitePaymentSheet from '../components/ElitePaymentSheet';

interface JetOption {
  id: string;
  manufacturer: string;
  model: string;
  capacity: number;
}

export default function ListPage() {
  const [formData, setFormData] = useState({
    departure_location: '',
    arrival_location: '',
    flight_date: '',
    departure_time: '',
    aircraft_model: '',
    jet_id: '',
    total_seats: '',
    available_seats: '',
    total_flight_cost: '',
    requested_share_amount: ''
  });

  const [jets, setJets] = useState<JetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [jetsLoading, setJetsLoading] = useState(true);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const [createdOfferId, setCreatedOfferId] = useState<string | null>(null);

  const { getThemedTextClasses } = useGdyupTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Fetch available jets
  useEffect(() => {
    fetchJets();
  }, []);

  const fetchJets = async () => {
    try {
      setJetsLoading(true);
      const response = await fetch('/api/jets');
      
      if (response.ok) {
        const data = await response.json();
        setJets(data.jets || []);
      }
    } catch (error) {
      console.error('Error fetching jets:', error);
    } finally {
      setJetsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate share amount when total cost or seats change
      if (field === 'total_flight_cost' || field === 'available_seats') {
        const cost = parseFloat(field === 'total_flight_cost' ? value : updated.total_flight_cost);
        const seats = parseInt(field === 'available_seats' ? value : updated.available_seats);
        
        if (cost > 0 && seats > 0) {
          updated.requested_share_amount = Math.round(cost / seats).toString();
        }
      }
      
      // Auto-fill aircraft model when jet is selected
      if (field === 'jet_id' && value) {
        const selectedJet = jets.find(jet => jet.id === value);
        if (selectedJet) {
          updated.aircraft_model = `${selectedJet.manufacturer} ${selectedJet.model}`;
          updated.total_seats = selectedJet.capacity.toString();
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to list a flight');
      router.push('/gdyup/auth/login');
      return;
    }

    // Validate required fields
    if (!formData.departure_location || !formData.arrival_location || !formData.flight_date || 
        !formData.total_flight_cost || !formData.requested_share_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Combine date and time for departure_time
      const departureDateTime = formData.departure_time 
        ? `${formData.flight_date}T${formData.departure_time}:00.000Z`
        : `${formData.flight_date}T12:00:00.000Z`;

      const offerData = {
        user_id: user.id,
        flight_date: departureDateTime,
        departure_time: departureDateTime,
        departure_location: formData.departure_location,
        arrival_location: formData.arrival_location,
        aircraft_model: formData.aircraft_model || null,
        jet_id: formData.jet_id || null,
        total_seats: parseInt(formData.total_seats) || null,
        available_seats: parseInt(formData.available_seats) || null,
        total_flight_cost: parseFloat(formData.total_flight_cost),
        requested_share_amount: parseFloat(formData.requested_share_amount),
        status: 'open'
      };

      const response = await fetch('/api/jetshare/createOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });

      const result = await response.json();

      if (response.ok) {
        const offerData = result.offer || result.data || result;
        setCreatedOfferId(offerData.id);
        
        toast.success('Flight listed successfully!');
        
        // Show premium upsell after successful listing
        setShowPremiumUpsell(true);
        
        // Reset form
        setFormData({
          departure_location: '',
          arrival_location: '',
          flight_date: '',
          departure_time: '',
          aircraft_model: '',
          jet_id: '',
          total_seats: '',
          available_seats: '',
          total_flight_cost: '',
          requested_share_amount: ''
        });
      } else {
        throw new Error(result.message || 'Failed to create offer');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to list flight');
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumUpgrade = () => {
    setShowPremiumUpsell(false);
    setShowPaymentSheet(true);
  };

  const handlePaymentComplete = (result: any) => {
    console.log('Premium upgrade payment completed:', result);
    setShowPaymentSheet(false);
    toast.success('Your listing is now featured!');
    router.push('/gdyup/flights');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Your listing is still active.');
  };

  return (
    <>
      <div className="main-content min-h-screen bg-gdyup-bg-dark">
        {/* Header */}
        <div className="px-6 py-6">
          <h1 className="gdyup-title text-3xl font-bold mb-2">
            List Your Flight
          </h1>
          <p className={cn("text-lg", getThemedTextClasses('secondary'))}>
            Share empty seats and recover costs
          </p>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="elite-card p-4 text-center"
              onClick={() => {
                // Auto-fill with common route
                setFormData(prev => ({
                  ...prev,
                  departure_location: 'Los Angeles, CA (LAX)',
                  arrival_location: 'New York, NY (JFK)',
                  flight_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }));
              }}
            >
              <Plus className="text-gdyup-primary mx-auto mb-2" size={24} />
              <div className={cn("font-medium", getThemedTextClasses())}>
                Quick List
              </div>
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                LAX → JFK
              </div>
            </button>
            
            <button 
              className="elite-card p-4 text-center"
              onClick={() => {
                // Set date for next week
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                setFormData(prev => ({
                  ...prev,
                  flight_date: nextWeek.toISOString().split('T')[0],
                  departure_time: '10:00'
                }));
              }}
            >
              <Calendar className="text-gdyup-primary mx-auto mb-2" size={24} />
              <div className={cn("font-medium", getThemedTextClasses())}>
                Schedule Later
              </div>
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                Next week
              </div>
            </button>
          </div>
        </div>

        {/* Flight Details Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-24">
          <div className="elite-card p-6 space-y-6">
            <h2 className={cn("text-xl font-bold", getThemedTextClasses())}>
              Flight Details
            </h2>

            {/* Route */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  <MapPin size={16} className="inline mr-1" />
                  From *
                </label>
                <input
                  type="text"
                  placeholder="Los Angeles, CA (LAX)"
                  value={formData.departure_location}
                  onChange={(e) => handleInputChange('departure_location', e.target.value)}
                  className="input-elite"
                  required
                />
              </div>
              
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  <MapPin size={16} className="inline mr-1" />
                  To *
                </label>
                <input
                  type="text"
                  placeholder="New York, NY (JFK)"
                  value={formData.arrival_location}
                  onChange={(e) => handleInputChange('arrival_location', e.target.value)}
                  className="input-elite"
                  required
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  <Calendar size={16} className="inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.flight_date}
                  onChange={(e) => handleInputChange('flight_date', e.target.value)}
                  className="input-elite"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  Departure Time
                </label>
                <input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => handleInputChange('departure_time', e.target.value)}
                  className="input-elite"
                />
              </div>
            </div>

            {/* Aircraft Selection */}
            <div>
              <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                <Plane size={16} className="inline mr-1" />
                Select Your Aircraft
              </label>
              {jetsLoading ? (
                <div className="input-elite flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading aircraft...
                </div>
              ) : (
                <select
                  value={formData.jet_id}
                  onChange={(e) => handleInputChange('jet_id', e.target.value)}
                  className="select-elite"
                >
                  <option value="">Select your aircraft</option>
                  {jets.map((jet) => (
                    <option key={jet.id} value={jet.id}>
                      {jet.manufacturer} {jet.model} (Capacity: {jet.capacity})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Manual Aircraft Entry (if no jet selected) */}
            {!formData.jet_id && (
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  Or Enter Aircraft Model
                </label>
                <input
                  type="text"
                  placeholder="e.g., Gulfstream G650"
                  value={formData.aircraft_model}
                  onChange={(e) => handleInputChange('aircraft_model', e.target.value)}
                  className="input-elite"
                />
              </div>
            )}

            {/* Seats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  <Users size={16} className="inline mr-1" />
                  Total Seats
                </label>
                <input
                  type="number"
                  placeholder="8"
                  value={formData.total_seats}
                  onChange={(e) => handleInputChange('total_seats', e.target.value)}
                  className="input-elite"
                  min="1"
                  max="50"
                />
              </div>
              
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  Available Seats *
                </label>
                <input
                  type="number"
                  placeholder="3"
                  value={formData.available_seats}
                  onChange={(e) => handleInputChange('available_seats', e.target.value)}
                  className="input-elite"
                  min="1"
                  max={formData.total_seats || "50"}
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  <DollarSign size={16} className="inline mr-1" />
                  Total Flight Cost (USD) *
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={formData.total_flight_cost}
                  onChange={(e) => handleInputChange('total_flight_cost', e.target.value)}
                  className="input-elite"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                  Price per Seat (USD) *
                </label>
                <input
                  type="number"
                  placeholder="16667"
                  value={formData.requested_share_amount}
                  onChange={(e) => handleInputChange('requested_share_amount', e.target.value)}
                  className="input-elite"
                  min="1"
                  required
                />
                {formData.total_flight_cost && formData.available_seats && (
                  <p className={cn("text-xs mt-1", getThemedTextClasses('muted'))}>
                    Suggested: ${Math.round(parseFloat(formData.total_flight_cost) / parseInt(formData.available_seats)).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-elite w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gdyup-button-text border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Listing...
                </>
              ) : (
                'List Flight'
              )}
            </button>
          </div>

          {/* Additional Options */}
          <div className="elite-card p-6 mt-6">
            <h3 className={cn("text-lg font-bold mb-4", getThemedTextClasses())}>
              Listing Benefits
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                <span className={getThemedTextClasses()}>
                  Instant booking available for verified travelers
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                <span className={getThemedTextClasses()}>
                  Automatic passenger verification and background checks
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                <span className={getThemedTextClasses()}>
                  Bitcoin and crypto payments accepted
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                <span className={getThemedTextClasses()}>
                  Only 7.5% platform fee on successful bookings
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Premium Upsell Modal */}
        {showPremiumUpsell && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="elite-card max-w-md w-full p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-white" />
              </div>
              
              <h3 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                Make Your Listing Premium?
              </h3>
              
              <p className={cn("text-sm mb-6", getThemedTextClasses('muted'))}>
                Boost your listing to the top of search results and get more bookings with premium features.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                  <span className={cn("text-sm", getThemedTextClasses())}>
                    Featured placement in search results
                  </span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                  <span className={cn("text-sm", getThemedTextClasses())}>
                    Highlighted with premium badge
                  </span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-2 h-2 bg-gdyup-primary rounded-full"></div>
                  <span className={cn("text-sm", getThemedTextClasses())}>
                    Priority customer support
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPremiumUpsell(false);
                    router.push('/gdyup/flights');
                  }}
                  className="btn-secondary-elite flex-1"
                >
                  Not Now
                </button>
                <button
                  onClick={handlePremiumUpgrade}
                  className="btn-primary-elite flex-1"
                >
                  Upgrade - $29
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Elite Payment Sheet */}
      <ElitePaymentSheet
        isOpen={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        amount={29}
        currency="USD"
        description="Premium listing upgrade"
        onPaymentComplete={handlePaymentComplete}
        onPaymentError={handlePaymentError}
      />
    </>
  );
} 