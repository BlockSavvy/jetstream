'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Plane,
  Calendar,
  User,
  DollarSign
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUi } from '../ui-context';

export function JetShareCreateDialog() {
  const { jetShareCreateOpen, closeJetShareDialogs, refreshOffers } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    departure_location: '',
    arrival_location: '',
    flight_date: '',
    total_flight_cost: '',
    requested_share_amount: '',
    status: 'open'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // First ensure the user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', formData.user_id)
        .maybeSingle();
      
      if (userError) {
        throw new Error(`Error validating user: ${userError.message}`);
      }
      
      if (!userData) {
        throw new Error(`User with ID ${formData.user_id} not found`);
      }
      
      // Create the JetShare offer
      const { error } = await supabase
        .from('jetshare_offers')
        .insert({
          user_id: formData.user_id,
          departure_location: formData.departure_location,
          arrival_location: formData.arrival_location,
          flight_date: formData.flight_date,
          total_flight_cost: parseFloat(formData.total_flight_cost),
          requested_share_amount: parseFloat(formData.requested_share_amount),
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success('JetShare offer created successfully');
      closeJetShareDialogs();
      refreshOffers();
      
      // Reset the form
      setFormData({
        user_id: '',
        departure_location: '',
        arrival_location: '',
        flight_date: '',
        total_flight_cost: '',
        requested_share_amount: '',
        status: 'open'
      });
      
    } catch (error: any) {
      console.error('Error creating JetShare offer:', error);
      toast.error(`Failed to create offer: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={jetShareCreateOpen} onOpenChange={closeJetShareDialogs}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New JetShare Offer</DialogTitle>
          <DialogDescription>
            Enter the details for a new JetShare offer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user_id" className="text-right">
                User ID
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="user_id"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    placeholder="Enter user ID"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_location" className="text-right">
                Departure
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Plane className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="departure_location"
                    name="departure_location"
                    value={formData.departure_location}
                    onChange={handleChange}
                    placeholder="E.g., LAX"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival_location" className="text-right">
                Arrival
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Plane className="mr-2 h-4 w-4 text-gray-500 transform rotate-90" />
                  <Input
                    id="arrival_location"
                    name="arrival_location"
                    value={formData.arrival_location}
                    onChange={handleChange}
                    placeholder="E.g., JFK"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="flight_date" className="text-right">
                Flight Date
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="flight_date"
                    name="flight_date"
                    type="date"
                    value={formData.flight_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total_flight_cost" className="text-right">
                Total Cost
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="total_flight_cost"
                    name="total_flight_cost"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.total_flight_cost}
                    onChange={handleChange}
                    placeholder="E.g., 10000"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requested_share_amount" className="text-right">
                Requested Share
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="requested_share_amount"
                    name="requested_share_amount"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.requested_share_amount}
                    onChange={handleChange}
                    placeholder="E.g., 5000"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-black">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Offer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 