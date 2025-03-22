'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Plane, 
  Clock, 
  MapPin, 
  Users, 
  Download, 
  Share2,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

// Simulated flight data - in a real app this would come from an API call
const flightData = {
  "1": {
    id: '1',
    route: 'New York → Los Angeles',
    airports: 'KTEB → KLAX',
    date: '2023-05-15T10:00:00',
    status: 'upcoming',
    passengerCount: 3,
    jetModel: 'Gulfstream G650',
    duration: '5h 45m',
    departureTerminal: 'Private Terminal A',
    arrivalTerminal: 'Private Terminal C',
    price: '$12,500'
  },
  "2": {
    id: '2',
    route: 'Los Angeles → Las Vegas',
    airports: 'KLAX → KLAS',
    date: '2023-06-02T14:30:00',
    status: 'upcoming',
    passengerCount: 2,
    jetModel: 'Bombardier Global 6000',
    duration: '1h 15m',
    departureTerminal: 'Private Terminal C',
    arrivalTerminal: 'Private Terminal B',
    price: '$5,250'
  },
  "3": {
    id: '3',
    route: 'Miami → New York',
    airports: 'KMIA → KTEB',
    date: '2023-04-10T08:45:00',
    status: 'completed',
    passengerCount: 4,
    jetModel: 'Embraer Phenom 300',
    duration: '2h 55m',
    departureTerminal: 'Private Terminal B',
    arrivalTerminal: 'Private Terminal A',
    price: '$8,750'
  }
}

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const flightId = params.id
  const flight = flightData[flightId as keyof typeof flightData]
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }
  
  // Handle flight not found
  if (!flight) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold">Flight Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Plane className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Flight #{flightId} not found</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              The flight you're looking for doesn't exist or you don't have access to view it.
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black" asChild>
              <Link href="/dashboard/flights">
                View All Flights
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold">Flight Details</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
          
          <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
            <Link href={`/dashboard/flights/${flightId}/ticket`}>
              <Download className="h-4 w-4" />
              <span>Download Ticket</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{flight.route}</CardTitle>
              <CardDescription>{flight.airports}</CardDescription>
            </div>
            <Badge variant={flight.status === 'upcoming' ? 'outline' : 'secondary'} className={flight.status === 'upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : ''}>
              {flight.status === 'upcoming' ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
              <div className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-amber-500" />
                <span>{formatDate(flight.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>{formatTime(flight.date)}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Flight Details</h3>
              <div className="flex items-center gap-2 text-lg">
                <Plane className="h-5 w-5 text-amber-500" />
                <span>{flight.jetModel}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>Duration: {flight.duration}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Passengers</h3>
              <div className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-amber-500" />
                <span>{flight.passengerCount} {flight.passengerCount === 1 ? 'Passenger' : 'Passengers'}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span>Price: {flight.price}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Flight Itinerary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Departure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Airport:</span>
                      <span className="font-medium">{flight.airports.split(' → ')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terminal:</span>
                      <span className="font-medium">{flight.departureTerminal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{formatTime(flight.date)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Arrival</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Airport:</span>
                      <span className="font-medium">{flight.airports.split(' → ')[1]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terminal:</span>
                      <span className="font-medium">{flight.arrivalTerminal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {/* Simulated arrival time - would calculate properly in real app */}
                        {formatTime(new Date(new Date(flight.date).getTime() + parseInt(flight.duration.split('h')[0]) * 60 * 60 * 1000 + parseInt(flight.duration.split('h')[1].replace('m', '').trim()) * 60 * 1000).toString())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          {flight.status === 'upcoming' ? (
            <>
              <Button variant="outline" size="lg" className="w-[48%]">Cancel Flight</Button>
              <Button className="w-[48%] bg-amber-500 hover:bg-amber-600 text-black" size="lg">Modify Flight</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" className="w-[48%]">Book Similar Flight</Button>
              <Button className="w-[48%] bg-amber-500 hover:bg-amber-600 text-black" size="lg">Review Flight</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 