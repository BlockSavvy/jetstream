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
import { 
  Calendar, 
  Plane, 
  Clock, 
  MapPin, 
  Users, 
  Download, 
  Printer,
  ArrowLeft,
  QrCode
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import Image from 'next/image'

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
    price: '$12,500',
    flightNumber: 'JS1045',
    boardingTime: '09:15 AM',
    gate: 'P3'
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
    price: '$5,250',
    flightNumber: 'JS2189',
    boardingTime: '02:00 PM',
    gate: 'P5'
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
    price: '$8,750',
    flightNumber: 'JS0945',
    boardingTime: '08:15 AM',
    gate: 'P2'
  }
}

export default function FlightTicketPage({ params }: { params: { id: string } }) {
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
          <h1 className="text-3xl font-bold">Ticket Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Plane className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Flight #{flightId} ticket not found</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              The flight ticket you're looking for doesn't exist or you don't have access to view it.
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
          <h1 className="text-3xl font-bold">Flight Ticket</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-2 border-dashed p-1">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Image 
                      src="/logo.png" 
                      alt="JetStream Logo" 
                      width={40} 
                      height={40} 
                      className="rounded"
                    />
                    <div>
                      <h2 className="font-bold text-lg">JetStream</h2>
                      <p className="text-xs text-muted-foreground">Boarding Pass</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-amber-500 text-black rounded px-3 py-1 inline-block font-medium">
                    {flight.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
                  </div>
                  <p className="text-sm mt-1">Flight: <span className="font-medium">{flight.flightNumber}</span></p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between border-t border-b py-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="text-2xl font-bold">{flight.airports.split(' → ')[0]}</p>
                  <p>{flight.route.split(' → ')[0]}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Terminal:</span> {flight.departureTerminal}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Gate:</span> {flight.gate}
                  </p>
                </div>
                
                <div className="flex items-center my-4 md:my-0">
                  <div className="border-t border-dashed flex-1"></div>
                  <Plane className="h-8 w-8 mx-2 text-amber-500 rotate-90" />
                  <div className="border-t border-dashed flex-1"></div>
                </div>
                
                <div className="flex-1 text-right">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="text-2xl font-bold">{flight.airports.split(' → ')[1]}</p>
                  <p>{flight.route.split(' → ')[1]}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Terminal:</span> {flight.arrivalTerminal}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Duration:</span> {flight.duration}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(flight.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Boarding Time</p>
                  <p className="font-medium">{flight.boardingTime}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="font-medium">{formatTime(flight.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Jet</p>
                  <p className="font-medium">{flight.jetModel}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Passenger</p>
                  <p className="font-medium">{user?.email || 'John Smith'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">Private</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Seat</p>
                  <p className="font-medium">N/A</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Boarding QR Code</CardTitle>
              <CardDescription>Present this QR code at the terminal</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="border p-4 rounded">
                <QrCode className="h-48 w-48 text-black" />
              </div>
              <p className="text-center mt-4 text-sm text-muted-foreground">
                Scan this code at the private terminal for seamless boarding
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Flight Information</CardTitle>
          <CardDescription>Important details about your flight</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <span className="font-medium">Check-in Instructions:</span> Please arrive at the private terminal at least 45 minutes before your scheduled departure time.
          </p>
          <p>
            <span className="font-medium">Baggage Allowance:</span> Each passenger is allowed 2 pieces of luggage up to 50 lbs each.
          </p>
          <p>
            <span className="font-medium">Amenities:</span> Complimentary refreshments, Wi-Fi, and personal concierge service available on board.
          </p>
          <p>
            <span className="font-medium">Contact:</span> For any questions or changes, please contact our 24/7 customer service at 1-800-JETSTREAM.
          </p>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/flights/${flightId}`}>
              View Flight Details
            </Link>
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-black">
            Add to Wallet
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 