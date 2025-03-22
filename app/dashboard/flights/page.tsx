'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Plane, 
  Clock, 
  MapPin, 
  Users, 
  Download, 
  ArrowRight,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

// Sample data for demonstration purposes
const upcomingFlights = [
  {
    id: '1',
    route: 'New York → Los Angeles',
    airports: 'KTEB → KLAX',
    date: '2023-05-15T10:00:00',
    status: 'upcoming',
    passengerCount: 3,
    jetModel: 'Gulfstream G650'
  },
  {
    id: '2',
    route: 'Los Angeles → Las Vegas',
    airports: 'KLAX → KLAS',
    date: '2023-06-02T14:30:00',
    status: 'upcoming',
    passengerCount: 2,
    jetModel: 'Bombardier Global 6000'
  }
];

const pastFlights = [
  {
    id: '3',
    route: 'Miami → New York',
    airports: 'KMIA → KTEB',
    date: '2023-04-10T08:45:00',
    status: 'completed',
    passengerCount: 4,
    jetModel: 'Embraer Phenom 300'
  },
  {
    id: '4',
    route: 'New York → Chicago',
    airports: 'KTEB → KORD',
    date: '2023-03-22T12:15:00',
    status: 'completed',
    passengerCount: 1,
    jetModel: 'Cessna Citation X'
  },
  {
    id: '5',
    route: 'Boston → Washington D.C.',
    airports: 'KBOS → KIAD',
    date: '2023-02-15T09:30:00',
    status: 'completed',
    passengerCount: 3,
    jetModel: 'Dassault Falcon 8X'
  }
];

export default function FlightsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')
  
  // Filter flights based on search term
  const filteredUpcoming = upcomingFlights.filter(flight => 
    flight.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.airports.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.jetModel.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredPast = pastFlights.filter(flight => 
    flight.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.airports.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.jetModel.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Flights</h1>
        <p className="text-muted-foreground">
          View and manage your upcoming and past flights
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="w-full md:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upcoming" className="flex gap-2 items-center">
                <Plane className="h-4 w-4" />
                <span>Upcoming ({filteredUpcoming.length})</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex gap-2 items-center">
                <Clock className="h-4 w-4" />
                <span>Past ({filteredPast.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search flights..."
              className="pl-8 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline">Filter</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="upcoming" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Flights</CardTitle>
              <CardDescription>Your scheduled flights that haven't happened yet</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUpcoming.length > 0 ? (
                <div className="divide-y">
                  {filteredUpcoming.map((flight) => (
                    <div key={flight.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{flight.route}</h3>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                              Upcoming
                            </Badge>
                          </div>
                          <div className="flex flex-wrap text-sm text-muted-foreground gap-x-4 gap-y-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(flight.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(flight.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {flight.airports}
                            </span>
                            <span className="flex items-center gap-1">
                              <Plane className="h-4 w-4" />
                              {flight.jetModel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {flight.passengerCount} {flight.passengerCount === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap md:flex-nowrap gap-2">
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <Link href={`/dashboard/flights/${flight.id}/ticket`}>
                              <Download className="h-4 w-4" />
                              <span>Ticket</span>
                            </Link>
                          </Button>
                          <Button className="bg-amber-500 hover:bg-amber-600 text-black" size="sm" asChild>
                            <Link href={`/dashboard/flights/${flight.id}`}>
                              <span>View Details</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Plane className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No upcoming flights found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    {searchTerm ? 'No flights match your search criteria' : 'You don\'t have any upcoming flights scheduled'}
                  </p>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black" asChild>
                    <Link href="/flights">
                      Book a Flight
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Past Flights</CardTitle>
              <CardDescription>Your flight history</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredPast.length > 0 ? (
                <div className="divide-y">
                  {filteredPast.map((flight) => (
                    <div key={flight.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{flight.route}</h3>
                            <Badge variant="outline">Completed</Badge>
                          </div>
                          <div className="flex flex-wrap text-sm text-muted-foreground gap-x-4 gap-y-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(flight.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(flight.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {flight.airports}
                            </span>
                            <span className="flex items-center gap-1">
                              <Plane className="h-4 w-4" />
                              {flight.jetModel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {flight.passengerCount} {flight.passengerCount === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/flights/${flight.id}`}>
                              <span>View Details</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No past flights found</h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchTerm ? 'No flights match your search criteria' : 'You haven\'t taken any flights with us yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 