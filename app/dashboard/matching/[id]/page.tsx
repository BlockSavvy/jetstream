'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Calendar,
  Plane,
  Users,
  ArrowRight,
  Clock,
  Briefcase,
  Wallet,
  Check,
  Circle,
  Star,
  Loader,
  MapPin,
  BarChart,
  Building,
  CalendarClock,
  UserCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { ClientIdParams } from '@/lib/types/route-types'

// Mock data - would be fetched from API in production
const matchData = {
  id: '1',
  route: 'New York → San Francisco',
  departure: '2023-06-20T09:30:00',
  arrival: '2023-06-20T13:45:00',
  matchScore: 98,
  price: 12500,
  tokenPrice: 2.12,
  companions: 4,
  aircraft: 'Gulfstream G650',
  airline: 'JetStream Private Aviation',
  reasons: [
    'Matches your preferred departure from New York',
    'Matches your preference for San Francisco destinations',
    'Morning departure time (09:30 AM)',
    '4 compatible travelers with similar interests',
    'Includes preferred amenities: Wi-Fi, Premium Dining',
    'Preferred aircraft type: Gulfstream G650',
    'Exceptional match for your travel preferences and style',
    'Compatible with your professional networking goals',
    'Aligns with your typical travel schedule'
  ],
  travelCompanions: [
    { 
      name: 'CEO A', 
      jobTitle: 'Chief Executive Officer', 
      industry: 'Technology',
      company: 'TechVenture',
      matchScore: 95,
      interests: ['AI', 'Venture Capital', 'Entrepreneurship']
    },
    { 
      name: 'VC Partner B', 
      jobTitle: 'Venture Capital Partner', 
      industry: 'Finance',
      company: 'Horizon Ventures',
      matchScore: 92,
      interests: ['Startups', 'Technology', 'Finance']
    },
    { 
      name: 'Marketing Director C', 
      jobTitle: 'Marketing Director', 
      industry: 'Technology',
      company: 'InnovateTech',
      matchScore: 88,
      interests: ['Digital Marketing', 'Product Launch', 'Brand Strategy']
    }
  ],
  amenities: [
    'Wi-Fi',
    'Premium Dining',
    'Meeting Facilities',
    'Sleep Suite',
    'Personal Workspace',
    'Entertainment System'
  ],
  airports: {
    origin: {
      code: 'KTEB',
      name: 'Teterboro Airport',
      terminal: 'Private Aviation Terminal',
      location: 'Teterboro, NJ'
    },
    destination: {
      code: 'KSFO',
      name: 'San Francisco International Airport',
      terminal: 'Private Aviation Terminal',
      location: 'San Francisco, CA'
    }
  },
  cancellationPolicy: 'Free cancellation up to 72 hours before departure',
  additionalServices: [
    { name: 'Ground Transportation', price: 250 },
    { name: 'Catering Upgrade', price: 350 },
    { name: 'Business Meeting Setup', price: 500 }
  ],
  image: '/placeholder.svg?height=400&width=800'
};

export default function MatchDetailPage({ params }: ClientIdParams) {
  const matchId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  
  // In a real app, we would fetch the match details based on the ID
  // const { data, loading, error } = useMatchDetails(matchId);
  
  const toggleAdditionalService = (service: string) => {
    if (additionalServices.includes(service)) {
      setAdditionalServices(additionalServices.filter(s => s !== service));
    } else {
      setAdditionalServices([...additionalServices, service]);
    }
  };
  
  const handleBooking = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Booking confirmed! You will be redirected to the payment page.');
      // In a real app, we would redirect to the payment page
      // router.push('/dashboard/bookings/payment');
    }, 1500);
  };
  
  // Calculate total price
  const basePrice = matchData.price * selectedSeats;
  const additionalServicesTotal = matchData.additionalServices
    .filter(service => additionalServices.includes(service.name))
    .reduce((total, service) => total + service.price, 0);
  const totalPrice = basePrice + additionalServicesTotal;
  
  // Calculate flight duration
  const departureTime = new Date(matchData.departure);
  const arrivalTime = new Date(matchData.arrival);
  const durationMs = arrivalTime.getTime() - departureTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/dashboard/matching" className="hover:underline">
          AI Flight Matching
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>Flight Details</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Section */}
          <Card className="overflow-hidden">
            <div className="relative h-64">
              <Image 
                src={matchData.image} 
                alt={matchData.route} 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  {matchData.matchScore}% Match
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-2xl font-bold mb-1">{matchData.route}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5 opacity-75" />
                    {formatDate(matchData.departure)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 opacity-75" />
                    {formatTime(matchData.departure)} - {formatTime(matchData.arrival)}
                  </span>
                  <span className="flex items-center">
                    <Plane className="h-4 w-4 mr-1.5 opacity-75" />
                    {matchData.aircraft}
                  </span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Departure</span>
                  <span className="text-xl font-semibold">{formatTime(matchData.departure)}</span>
                  <span className="text-sm">{formatDate(matchData.departure)}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{matchData.airports.origin.code} · {matchData.airports.origin.name}</span>
                  <span className="text-xs text-muted-foreground">{matchData.airports.origin.location}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-full flex items-center justify-center">
                    <Separator className="w-full absolute" />
                    <div className="bg-white dark:bg-gray-950 z-10 px-2">
                      <Plane className="h-5 w-5 text-muted-foreground rotate-90" />
                    </div>
                  </div>
                  <span className="mt-1 text-sm font-medium">{durationHours}h {durationMinutes}m</span>
                  <span className="text-xs text-muted-foreground">Direct Flight</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Arrival</span>
                  <span className="text-xl font-semibold">{formatTime(matchData.arrival)}</span>
                  <span className="text-sm">{formatDate(matchData.arrival)}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{matchData.airports.destination.code} · {matchData.airports.destination.name}</span>
                  <span className="text-xs text-muted-foreground">{matchData.airports.destination.location}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {matchData.amenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Why This Flight Matches You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {matchData.reasons.map((reason, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Travel Companions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                Compatible Travel Companions
              </CardTitle>
              <CardDescription>
                Professionals matched to your preferences and networking goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {matchData.travelCompanions.map((companion, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 border-b pb-6 last:pb-0 last:border-b-0">
                    <div className="md:w-1/4">
                      <div className="rounded-full bg-muted h-16 w-16 flex items-center justify-center mb-2">
                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="font-semibold">{companion.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {companion.matchScore}% Match
                      </div>
                    </div>
                    
                    <div className="md:w-3/4 space-y-3">
                      <div>
                        <div className="flex items-center mb-1">
                          <Briefcase className="h-4 w-4 mr-1.5 text-muted-foreground" />
                          <span className="font-medium">{companion.jobTitle}</span>
                        </div>
                        <div className="flex items-center mb-1">
                          <Building className="h-4 w-4 mr-1.5 text-muted-foreground" />
                          <span className="text-sm">{companion.company} · {companion.industry}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-1">Common Interests:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {companion.interests.map((interest, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Booking Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Book This Flight</CardTitle>
              <CardDescription>
                Secure your seat on this highly compatible flight
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-medium">Price per seat</div>
                <div className="text-xl font-semibold">{formatCurrency(matchData.price)}</div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-sm font-medium">Number of Seats</label>
                <div className="flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setSelectedSeats(Math.max(1, selectedSeats - 1))}
                    disabled={selectedSeats <= 1}
                  >-</Button>
                  <div className="flex-1 flex items-center justify-center h-9 border-y">
                    {selectedSeats}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setSelectedSeats(Math.min(4, selectedSeats + 1))}
                    disabled={selectedSeats >= 4}
                  >+</Button>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-sm font-medium mb-2">Additional Services</div>
                <div className="space-y-2">
                  {matchData.additionalServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`service-${index}`}
                          checked={additionalServices.includes(service.name)}
                          onChange={() => toggleAdditionalService(service.name)}
                          className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <label htmlFor={`service-${index}`} className="text-sm">
                          {service.name}
                        </label>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Base price ({selectedSeats} {selectedSeats === 1 ? 'seat' : 'seats'})</span>
                  <span className="text-sm font-medium">{formatCurrency(basePrice)}</span>
                </div>
                
                {additionalServices.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Additional services</span>
                    <span className="text-sm font-medium">{formatCurrency(additionalServicesTotal)}</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2">
                  <span className="font-semibold">Total price</span>
                  <span className="text-xl font-bold">{formatCurrency(totalPrice)}</span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <span className="flex items-center mb-1">
                    <CalendarClock className="h-3 w-3 mr-1" /> 
                    {matchData.cancellationPolicy}
                  </span>
                  <span className="flex items-center">
                    <Wallet className="h-3 w-3 mr-1" /> 
                    Pay with cash or {matchData.tokenPrice} JET tokens
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={handleBooking}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Book Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/matching">
                  View Other Matches
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper component for the breadcrumb chevron
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
} 