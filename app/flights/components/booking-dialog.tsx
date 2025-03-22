import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Flight, BookingFormData, PaymentMethod } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CreditCard, Info, Loader2 } from 'lucide-react';
import { PaymentMethods } from './payment-methods';
import { StripePayment } from './stripe-payment';
import { CoinbasePayment } from './coinbase-payment';
import { TokenPayment } from './token-payment';

interface BookingDialogProps {
  flight: Flight | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function BookingDialog({ flight, isOpen, onClose, userId }: BookingDialogProps) {
  const router = useRouter();
  
  const [activeStep, setActiveStep] = useState<'info' | 'payment' | 'confirmation'>('info');
  const [seats, setSeats] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!flight) return null;
  
  // Parse the flight information
  const originAirport = flight.airports || flight.origin || { city: 'Unknown', code: 'N/A', name: 'Unknown', country: 'Unknown' };
  const destinationAirport = flight["airports!flights_destination_airport_fkey"] || flight.destination || { city: 'Unknown', code: 'N/A', name: 'Unknown', country: 'Unknown' };
  const departureDate = new Date(flight.departure_time);
  const pricePerSeat = flight.base_price;
  
  // Calculate total price with additional fees
  const subtotal = pricePerSeat * seats;
  const serviceFee = subtotal * 0.05; // 5% service fee
  const totalPrice = subtotal + serviceFee;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const handleContinueToPayment = () => {
    if (!userId) {
      setError('You must be logged in to book a flight');
      return;
    }
    
    if (seats <= 0 || seats > flight.available_seats) {
      setError(`Please select between 1 and ${flight.available_seats} seats`);
      return;
    }
    
    setError(null);
    setActiveStep('payment');
  };
  
  const handlePaymentMethodSelect = (method: PaymentMethod | undefined) => {
    setSelectedPaymentMethod(method);
  };
  
  const handlePaymentSuccess = (id: string) => {
    setPaymentIntentId(id);
  };
  
  const handlePaymentError = (message: string) => {
    setError(message);
  };
  
  const handleSubmit = async () => {
    if (!userId) {
      setError('You must be logged in to book a flight');
      return;
    }
    
    if (selectedPaymentMethod === 'stripe' && !paymentIntentId) {
      setError('Please complete the payment form');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const bookingData: BookingFormData = {
        flightId: flight.id,
        userId,
        seatsBooked: seats,
        totalPrice,
        specialRequests: specialRequests || undefined,
        paymentMethod: selectedPaymentMethod,
        tokenId: selectedPaymentMethod === 'token' ? paymentIntentId || undefined : undefined
      };
      
      const response = await fetch('/api/flights/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          paymentIntentId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book flight');
      }
      
      setBookingSuccess(true);
      // Refresh the flights data after booking
      router.refresh();
      
      // Reset form after successful booking
      setTimeout(() => {
        setSeats(1);
        setSpecialRequests('');
        setSelectedPaymentMethod(undefined);
        setPaymentIntentId(null);
        setBookingSuccess(false);
        setActiveStep('info');
        onClose();
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Content when booking is successful
  if (bookingSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Booking Confirmed!</DialogTitle>
            <DialogDescription>
              Your booking has been successfully processed. You will receive a confirmation email shortly with your e-ticket.
            </DialogDescription>
          </div>
          <DialogFooter>
            <Button onClick={onClose} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Your Flight</DialogTitle>
          <DialogDescription>
            Complete your booking for the flight from {originAirport.city} to {destinationAirport.city}.
          </DialogDescription>
        </DialogHeader>
        
        {activeStep === 'info' ? (
          <>
            <Card className="border-muted bg-muted/30 my-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Flight Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flight</span>
                  <span className="font-medium">{flight.jets.manufacturer} {flight.jets.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{format(departureDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{format(departureDate, 'h:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium">{originAirport.code} → {destinationAirport.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seats Available</span>
                  <span className="font-medium">{flight.available_seats}</span>
                </div>
              </CardContent>
            </Card>
          
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                  min={1}
                  max={flight.available_seats}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests</Label>
                <Textarea
                  id="special-requests"
                  placeholder="Any dietary requirements, accessibility needs, or other requests..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>
              
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Seat Price × {seats}</span>
                    <span>{formatCurrency(pricePerSeat)} × {seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                </CardFooter>
              </Card>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!userId && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You need to sign in to complete your booking.
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleContinueToPayment} 
                disabled={isSubmitting || !userId}
              >
                Continue to Payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Card className="border-muted bg-muted/30 my-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Flight</span>
                  <span className="text-sm font-medium">{originAirport.code} → {destinationAirport.code}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm font-medium">{formatCurrency(totalPrice)}</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Payment Method</h3>
                
                <PaymentMethods 
                  userId={userId}
                  flightId={flight.id}
                  jetId={flight.jet_id}
                  onSelectMethod={handlePaymentMethodSelect}
                />
              </div>
              
              {selectedPaymentMethod && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                  
                  {selectedPaymentMethod === 'stripe' && (
                    <StripePayment
                      flightId={flight.id}
                      userId={userId || ''}
                      seatsBooked={seats}
                      totalPrice={totalPrice}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  )}
                  
                  {selectedPaymentMethod === 'coinbase' && (
                    <CoinbasePayment
                      flightId={flight.id}
                      userId={userId || ''}
                      seatsBooked={seats}
                      totalPrice={totalPrice}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  )}
                  
                  {selectedPaymentMethod === 'token' && (
                    <TokenPayment
                      flightId={flight.id}
                      userId={userId || ''}
                      jetId={flight.jet_id}
                      seatsBooked={seats}
                      totalPrice={totalPrice}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  )}
                </div>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveStep('info')} 
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !selectedPaymentMethod || (selectedPaymentMethod !== 'token' && !paymentIntentId)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Booking'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 