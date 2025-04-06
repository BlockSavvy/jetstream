'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  DollarSign,
  Users,
  Timer
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUi } from '../ui-context';
import { getJets } from '../../utils/data-fetching';

export function FlightCreateDialog() {
  const { flightCreateOpen, closeFlightDialogs, refreshFlights } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jets, setJets] = useState<any[]>([]);
  const [isLoadingJets, setIsLoadingJets] = useState(true);
  
  const [formData, setFormData] = useState({
    jet_id: '',
    origin_airport: '',
    destination_airport: '',
    departure_time: '',
    departure_time_hour: '12',
    departure_time_minute: '00',
    departure_time_ampm: 'PM',
    arrival_time: '',
    arrival_time_hour: '12',
    arrival_time_minute: '00',
    arrival_time_ampm: 'PM',
    available_seats: '0',
    base_price: '',
    status: 'scheduled'
  });

  // Load jets for dropdown
  useEffect(() => {
    const loadJets = async () => {
      try {
        setIsLoadingJets(true);
        const jetsData = await getJets();
        setJets(jetsData);
      } catch (error) {
        console.error('Error loading jets:', error);
        toast.error('Failed to load jets');
      } finally {
        setIsLoadingJets(false);
      }
    };
    
    if (flightCreateOpen) {
      loadJets();
    }
  }, [flightCreateOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const combineDateTime = (date: string, hour: string, minute: string, ampm: string) => {
    if (!date) return '';
    
    let hourNum = parseInt(hour, 10);
    if (ampm === 'PM' && hourNum < 12) hourNum += 12;
    if (ampm === 'AM' && hourNum === 12) hourNum = 0;
    
    const formattedHour = hourNum.toString().padStart(2, '0');
    return `${date}T${formattedHour}:${minute}:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Combine date and time
      const departureDateTime = combineDateTime(
        formData.departure_time,
        formData.departure_time_hour,
        formData.departure_time_minute,
        formData.departure_time_ampm
      );
      
      const arrivalDateTime = combineDateTime(
        formData.arrival_time,
        formData.arrival_time_hour,
        formData.arrival_time_minute,
        formData.arrival_time_ampm
      );
      
      // Create the flight offer
      const { error } = await supabase
        .from('flights')
        .insert({
          jet_id: formData.jet_id,
          origin_airport: formData.origin_airport,
          destination_airport: formData.destination_airport,
          departure_time: departureDateTime,
          arrival_time: arrivalDateTime,
          available_seats: parseInt(formData.available_seats),
          base_price: parseFloat(formData.base_price),
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success('Flight created successfully');
      closeFlightDialogs();
      refreshFlights();
      
      // Reset the form
      setFormData({
        jet_id: '',
        origin_airport: '',
        destination_airport: '',
        departure_time: '',
        departure_time_hour: '12',
        departure_time_minute: '00',
        departure_time_ampm: 'PM',
        arrival_time: '',
        arrival_time_hour: '12',
        arrival_time_minute: '00',
        arrival_time_ampm: 'PM',
        available_seats: '0',
        base_price: '',
        status: 'scheduled'
      });
      
    } catch (error: any) {
      console.error('Error creating flight:', error);
      toast.error(`Failed to create flight: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={flightCreateOpen} onOpenChange={closeFlightDialogs}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Flight</DialogTitle>
          <DialogDescription>
            Enter the details for a new flight.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jet_id" className="text-right">
                Aircraft
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.jet_id}
                  onValueChange={(value) => handleSelectChange('jet_id', value)}
                  disabled={isLoadingJets}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Plane className="mr-2 h-4 w-4 text-gray-500" />
                      <SelectValue placeholder={isLoadingJets ? "Loading jets..." : "Select aircraft"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {jets.map((jet) => (
                      <SelectItem key={jet.id} value={jet.id}>
                        {jet.manufacturer} {jet.model} ({jet.tail_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="origin_airport" className="text-right">
                Origin
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Plane className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="origin_airport"
                    name="origin_airport"
                    value={formData.origin_airport}
                    onChange={handleChange}
                    placeholder="E.g., LAX"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destination_airport" className="text-right">
                Destination
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Plane className="mr-2 h-4 w-4 text-gray-500 transform rotate-90" />
                  <Input
                    id="destination_airport"
                    name="destination_airport"
                    value={formData.destination_airport}
                    onChange={handleChange}
                    placeholder="E.g., JFK"
                    required
                  />
                </div>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure_time" className="text-right">
                Departure Date
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="departure_time"
                    name="departure_time"
                    type="date"
                    value={formData.departure_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Departure Time
              </Label>
              <div className="col-span-3 flex space-x-2 items-center">
                <Timer className="h-4 w-4 text-gray-500" />
                <Select
                  value={formData.departure_time_hour}
                  onValueChange={(value) => handleSelectChange('departure_time_hour', value)}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select
                  value={formData.departure_time_minute}
                  onValueChange={(value) => handleSelectChange('departure_time_minute', value)}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map(minute => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.departure_time_ampm}
                  onValueChange={(value) => handleSelectChange('departure_time_ampm', value)}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival_time" className="text-right">
                Arrival Date
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="arrival_time"
                    name="arrival_time"
                    type="date"
                    value={formData.arrival_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Arrival Time
              </Label>
              <div className="col-span-3 flex space-x-2 items-center">
                <Timer className="h-4 w-4 text-gray-500" />
                <Select
                  value={formData.arrival_time_hour}
                  onValueChange={(value) => handleSelectChange('arrival_time_hour', value)}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select
                  value={formData.arrival_time_minute}
                  onValueChange={(value) => handleSelectChange('arrival_time_minute', value)}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map(minute => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.arrival_time_ampm}
                  onValueChange={(value) => handleSelectChange('arrival_time_ampm', value)}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="available_seats" className="text-right">
                Available Seats
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="available_seats"
                    name="available_seats"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.available_seats}
                    onChange={handleChange}
                    placeholder="E.g., 8"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="base_price" className="text-right">
                Base Price
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="base_price"
                    name="base_price"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.base_price}
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                    <SelectItem value="in_air">In Air</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                'Create Flight'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 