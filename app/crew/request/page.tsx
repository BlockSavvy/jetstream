"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, User, MapPin, Clock, Star, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/components/auth-provider';
import { CrewSpecialization } from '@/lib/types/crew.types';
import { toast } from 'sonner';

const SPECIALIZATIONS: CrewSpecialization[] = [
  'Comedy',
  'TED-talks',
  'Live Podcasts',
  'Wellness Sessions',
  'Business Networking',
  'Family-friendly Activities',
  'Musical Performances',
  'Interactive Mystery Events',
  'Culinary Experiences',
  'Wine Tasting',
  'Sports Commentary',
  'Tech Demos',
  'Creative Workshops',
  'Executive Coaching'
];

const POPULAR_DESTINATIONS = [
  'New York',
  'Miami',
  'Los Angeles',
  'Las Vegas',
  'London',
  'Paris',
  'Dubai',
  'Tokyo',
  'Singapore',
  'Sydney'
];

const POPULAR_ORIGINS = [
  'New York',
  'Los Angeles',
  'London',
  'Dubai',
  'Hong Kong',
  'Singapore',
  'Miami',
  'Tokyo',
  'Paris',
  'San Francisco'
];

export default function RequestCustomFlightPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<CrewSpecialization[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const toggleSpecialization = (specialization: CrewSpecialization) => {
    if (selectedSpecializations.includes(specialization)) {
      setSelectedSpecializations(selectedSpecializations.filter(s => s !== specialization));
    } else {
      setSelectedSpecializations([...selectedSpecializations, specialization]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSpecializations.length === 0) {
      setError('Please select at least one specialization for your custom flight');
      return;
    }
    
    if (!origin || !destination) {
      setError('Please specify both origin and destination');
      return;
    }
    
    if (!date) {
      setError('Please select a preferred date for your flight');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call the API
      const response = await fetch('/api/custom-itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin,
          destination,
          dateTime: date.toISOString(),
          description,
          requestedSpecializations: selectedSpecializations
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      // Success
      toast.success('Your custom flight request has been submitted!');
      
      // Redirect to dashboard or confirmation page
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-8 space-y-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Request a Custom Flight Experience</h1>
        <p className="text-muted-foreground mb-6">
          Tell us about your dream flight experience and our specialized crew will make it happen.
        </p>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!user ? (
          <Alert className="mb-6">
            <User className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be signed in to request a custom flight experience.
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => router.push('/auth/signin')}>
                Sign in now
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Flight Details</CardTitle>
                <CardDescription>
                  Provide details about your desired custom flight
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin</Label>
                    <Select 
                      value={origin} 
                      onValueChange={setOrigin}
                      required
                    >
                      <SelectTrigger id="origin">
                        <SelectValue placeholder="Select origin" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_ORIGINS.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Select 
                      value={destination} 
                      onValueChange={setDestination}
                      required
                    >
                      <SelectTrigger id="destination">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_DESTINATIONS.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Preferred Date</Label>
                  <DatePicker 
                    date={date} 
                    onDateChange={`function(date) {
                      this.setDate(date);
                    }`}
                    className="w-full"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Preferred Specializations</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select the types of experiences you'd like to have during your flight
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS.map((specialization) => (
                      <Badge
                        key={specialization}
                        variant={selectedSpecializations.includes(specialization) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedSpecializations.includes(specialization)
                            ? "bg-amber-500 hover:bg-amber-600 text-white" 
                            : "bg-background hover:bg-muted"
                        }`}
                        onClick={() => toggleSpecialization(specialization)}
                      >
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us more about your desired experience, special requests, or any other details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={loading || !user}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
} 