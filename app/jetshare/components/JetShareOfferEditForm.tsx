'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface JetShareOfferEditFormProps {
  offer: JetShareOfferWithUser;
  userId: string;
}

export default function JetShareOfferEditForm({ offer, userId }: JetShareOfferEditFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    departure_location: offer.departure_location,
    arrival_location: offer.arrival_location,
    flight_date: new Date(offer.flight_date),
    total_flight_cost: offer.total_flight_cost,
    requested_share_amount: offer.requested_share_amount,
    aircraft_model: offer.aircraft_model || 'Gulfstream G650',
    total_seats: offer.total_seats || 8,
    available_seats: offer.available_seats || 4
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.departure_location) {
      newErrors.departure_location = 'Departure location is required';
    }
    
    if (!formData.arrival_location) {
      newErrors.arrival_location = 'Arrival location is required';
    }
    
    if (!formData.flight_date) {
      newErrors.flight_date = 'Flight date is required';
    } else if (formData.flight_date < new Date()) {
      newErrors.flight_date = 'Flight date must be in the future';
    }
    
    if (!formData.total_flight_cost || formData.total_flight_cost <= 0) {
      newErrors.total_flight_cost = 'Total flight cost must be greater than 0';
    }
    
    if (!formData.requested_share_amount || formData.requested_share_amount <= 0) {
      newErrors.requested_share_amount = 'Requested share amount must be greater than 0';
    } else if (formData.requested_share_amount >= formData.total_flight_cost) {
      newErrors.requested_share_amount = 'Share amount must be less than total cost';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/jetshare/updateOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offer.id,
          ...formData,
          // Convert date to ISO string
          flight_date: format(formData.flight_date, 'yyyy-MM-dd'),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update the offer');
      }
      
      toast.success('Offer updated successfully');
      router.push(`/jetshare/offer/${offer.id}`);
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update the offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'total_flight_cost' || name === 'requested_share_amount') {
      // Parse as number and handle NaN
      const numValue = parseFloat(value);
      setFormData({
        ...formData,
        [name]: isNaN(numValue) ? 0 : numValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        flight_date: date
      });
    }
  };
  
  return (
    <Card className="p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="departure_location">Departure Location</Label>
            <Input
              id="departure_location"
              name="departure_location"
              value={formData.departure_location}
              onChange={handleInputChange}
              placeholder="e.g., New York (JFK)"
              className={errors.departure_location ? 'border-red-500' : ''}
            />
            {errors.departure_location && (
              <p className="text-red-500 text-sm">{errors.departure_location}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="arrival_location">Arrival Location</Label>
            <Input
              id="arrival_location"
              name="arrival_location"
              value={formData.arrival_location}
              onChange={handleInputChange}
              placeholder="e.g., Los Angeles (LAX)"
              className={errors.arrival_location ? 'border-red-500' : ''}
            />
            {errors.arrival_location && (
              <p className="text-red-500 text-sm">{errors.arrival_location}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="flight_date">Flight Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="flight_date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.flight_date && "text-muted-foreground",
                    errors.flight_date ? 'border-red-500' : ''
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.flight_date ? format(formData.flight_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.flight_date}
                  onSelect={handleDateChange}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {errors.flight_date && (
              <p className="text-red-500 text-sm">{errors.flight_date}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aircraft_model">Aircraft Model</Label>
            <Input
              id="aircraft_model"
              name="aircraft_model"
              value={formData.aircraft_model}
              onChange={handleInputChange}
              placeholder="e.g., Gulfstream G650"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total_flight_cost">Total Flight Cost ($)</Label>
            <Input
              id="total_flight_cost"
              name="total_flight_cost"
              type="number"
              value={formData.total_flight_cost}
              onChange={handleInputChange}
              placeholder="e.g., 25000"
              className={errors.total_flight_cost ? 'border-red-500' : ''}
            />
            {errors.total_flight_cost && (
              <p className="text-red-500 text-sm">{errors.total_flight_cost}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requested_share_amount">Requested Share Amount ($)</Label>
            <Input
              id="requested_share_amount"
              name="requested_share_amount"
              type="number"
              value={formData.requested_share_amount}
              onChange={handleInputChange}
              placeholder="e.g., 12500"
              className={errors.requested_share_amount ? 'border-red-500' : ''}
            />
            {errors.requested_share_amount && (
              <p className="text-red-500 text-sm">{errors.requested_share_amount}</p>
            )}
            {formData.total_flight_cost > 0 && formData.requested_share_amount > 0 && (
              <p className="text-sm text-muted-foreground">
                Share percentage: {((formData.requested_share_amount / formData.total_flight_cost) * 100).toFixed(0)}%
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Offer'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
} 