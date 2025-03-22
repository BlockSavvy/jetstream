'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { 
  CalendarDays, 
  CreditCard, 
  Plane, 
  Users, 
  Download, 
  MapPin, 
  Clock, 
  Settings, 
  Star, 
  Ticket, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Bell,
  ArrowRight,
  TrendingUp,
  Wallet,
  BarChart,
  Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils/format'
import { getPrimaryJetImage } from '@/lib/utils/jet-images'

// Sample data for demonstration purposes
const upcomingFlights = [
  {
    id: '1',
    route: 'New York → Los Angeles',
    airports: 'KTEB → KLAX',
    date: '2023-05-15T10:00:00',
    status: 'upcoming',
    passengerCount: 3
  },
  {
    id: '2',
    route: 'Los Angeles → Las Vegas',
    airports: 'KLAX → KLAS',
    date: '2023-06-02T14:30:00',
    status: 'upcoming',
    passengerCount: 2
  }
];

const pastFlights = [
  {
    id: '3',
    route: 'Miami → New York',
    airports: 'KMIA → KTEB',
    date: '2023-04-10T08:45:00',
    status: 'completed',
    passengerCount: 4
  },
  {
    id: '4',
    route: 'New York → Chicago',
    airports: 'KTEB → KORD',
    date: '2023-03-22T12:15:00',
    status: 'completed',
    passengerCount: 1
  }
];

const tokens = [
  {
    id: '1',
    jetModel: 'Gulfstream G650',
    percentage: 10,
    value: 2750000,
    availableHours: 80,
    remainingHours: 65,
    status: 'active'
  },
  {
    id: '2',
    jetModel: 'Bombardier Global 6000',
    percentage: 5,
    value: 1250000,
    availableHours: 40,
    remainingHours: 28,
    status: 'active'
  },
  {
    id: '3',
    jetModel: 'Embraer Phenom 300',
    percentage: 12.5,
    value: 875000,
    availableHours: 100,
    remainingHours: 88,
    status: 'active'
  }
];

const recommendedFlights = [
  {
    id: '1',
    route: 'New York → San Francisco',
    description: 'Premium Business Experience',
    date: '2023-05-20T09:30:00',
    companions: 4,
    matchScore: 98,
    price: 12500,
    jetManufacturer: 'Gulfstream', 
    jetModel: 'G650',
    image: getPrimaryJetImage('Gulfstream', 'G650')
  },
  {
    id: '2',
    route: 'Miami → Las Vegas',
    description: 'Entertainment Industry Networking',
    date: '2023-06-15T11:00:00',
    companions: 6,
    matchScore: 93,
    price: 8750,
    jetManufacturer: 'Bombardier',
    jetModel: 'Global 6000',
    image: getPrimaryJetImage('Bombardier', 'Global 6000')
  },
  {
    id: '3',
    route: 'Los Angeles → Aspen',
    description: 'Luxury Retreat Experience',
    date: '2023-07-05T10:15:00',
    companions: 3,
    matchScore: 91,
    price: 14200,
    jetManufacturer: 'Embraer',
    jetModel: 'Phenom 300E',
    image: getPrimaryJetImage('Embraer', 'Phenom 300E')
  }
];

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

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
    return null // We're redirecting, no need to render anything
  }

  return (
    <div>
      <div className="flex flex-col space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold dark:text-white">Welcome back, {user.email?.split('@')[0] || 'Traveler'}</h1>
            <p className="text-muted-foreground dark:text-gray-400">
              Here's an overview of your account and upcoming trips
            </p>
          </div>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold md:w-auto w-full"
            asChild
          >
            <Link href="/flights">
              Book a New Flight
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Upcoming Flights</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingFlights.length}</div>
              <p className="text-xs text-muted-foreground">
                Next flight: {upcomingFlights.length > 0 ? upcomingFlights[0].route : 'None scheduled'}, {upcomingFlights.length > 0 ? formatDate(upcomingFlights[0].date) : ''}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto font-normal text-xs text-muted-foreground" asChild>
                <Link href="/dashboard/flights">
                  <span>View all flights</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Owned Tokens</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens.reduce((acc, token) => acc + token.percentage, 0).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Across {tokens.length} different aircraft
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto font-normal text-xs text-muted-foreground" asChild>
                <Link href="/dashboard/tokens">
                  <span>Manage tokens</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Flight Hours</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens.reduce((acc, token) => acc + token.remainingHours, 0)}</div>
              <p className="text-xs text-muted-foreground">
                Available hours remaining
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Used</span>
                  <span>
                    {tokens.reduce((acc, token) => acc + (token.availableHours - token.remainingHours), 0)}/
                    {tokens.reduce((acc, token) => acc + token.availableHours, 0)} hrs
                  </span>
                </div>
                <Progress 
                  value={tokens.reduce((acc, token) => acc + (token.availableHours - token.remainingHours), 0) / 
                          tokens.reduce((acc, token) => acc + token.availableHours, 0) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto font-normal text-xs text-muted-foreground" asChild>
                <Link href="/dashboard/tokens">
                  <span>View usage details</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(tokens.reduce((acc, token) => acc + token.value, 0))}</div>
              <p className="text-xs text-muted-foreground">
                Total token value +5.3% from last month
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto font-normal text-xs text-muted-foreground" asChild>
                <Link href="/dashboard/tokens">
                  <span>View portfolio</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="overview" className="flex gap-2 items-center">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex gap-2 items-center">
              <Plane className="h-4 w-4" />
              <span className="hidden md:inline">My Flights</span>
            </TabsTrigger>
            <TabsTrigger value="recommended" className="flex gap-2 items-center">
              <Star className="h-4 w-4" />
              <span className="hidden md:inline">Recommended</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Upcoming flight */}
            {upcomingFlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next Flight</CardTitle>
                  <CardDescription>Your upcoming flights and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-4 items-center">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
                        <Plane className="h-8 w-8 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-xl font-semibold mb-1">{upcomingFlights[0].route}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(upcomingFlights[0].date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(upcomingFlights[0].date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {upcomingFlights[0].airports}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {upcomingFlights[0].passengerCount} Passengers
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                      <Button variant="outline" size="sm" className="gap-1" asChild>
                        <Link href={`/dashboard/flights/${upcomingFlights[0].id}/ticket`}>
                          <Download className="h-4 w-4" />
                          Ticket
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                        asChild
                      >
                        <Link href={`/dashboard/flights/${upcomingFlights[0].id}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Token overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Owned Tokens</CardTitle>
                <CardDescription>Your fractional jet ownership tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokens.map((token) => (
                    <div key={token.id} className="flex flex-col md:flex-row justify-between border-b pb-4 last:border-b-0 last:pb-0 gap-4">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <h4 className="font-semibold">{token.jetModel}</h4>
                          <Badge variant="outline">{token.percentage}%</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(token.value)} • {token.remainingHours} hrs remaining
                        </div>
                      </div>
                      <div className="flex flex-col w-full md:w-auto md:items-end">
                        <div className="text-sm mb-1 flex justify-between md:justify-end w-full">
                          <span className="md:hidden">Hours Used:</span>
                          <span>
                            {token.availableHours - token.remainingHours}/{token.availableHours} hrs
                          </span>
                        </div>
                        <Progress 
                          value={(token.availableHours - token.remainingHours) / token.availableHours * 100} 
                          className="h-2 w-full md:w-36"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full md:w-auto" variant="outline" asChild>
                  <Link href="/dashboard/tokens">
                    View All Tokens
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* AI Recommended section preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended For You</CardTitle>
                <CardDescription>Flights matched to your profile and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <Image 
                      src={recommendedFlights[0].image} 
                      alt={recommendedFlights[0].route} 
                      fill 
                      className="object-cover" 
                    />
                    <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
                      <h4 className="font-bold text-xl">{recommendedFlights[0].route}</h4>
                      <p className="text-sm opacity-90">{recommendedFlights[0].description}</p>
                    </div>
                    <div className="absolute top-2 right-2 z-20">
                      <Badge className="bg-amber-500 hover:bg-amber-600">{recommendedFlights[0].matchScore}% Match</Badge>
                    </div>
                    <div className="absolute bottom-4 right-4 z-20">
                      <Button size="sm" className="bg-white text-black hover:bg-gray-100" asChild>
                        <Link href="/dashboard/matching">
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full md:w-auto" variant="outline" asChild>
                  <Link href="/dashboard/matching">
                    View All Recommendations
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Flights Tab */}
          <TabsContent value="flights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Flights</CardTitle>
                <CardDescription>View and manage your upcoming and past flights.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Upcoming Flights</h3>
                    <div className="space-y-4">
                      {upcomingFlights.map((flight) => (
                        <div key={flight.id} className="border rounded-lg p-4 hover:border-amber-500 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex gap-4 items-center">
                              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                                <Plane className="h-6 w-6 text-amber-500" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{flight.route}</h4>
                                  <Badge>Upcoming</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" /> 
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
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-auto">
                              <Button size="sm" variant="outline" className="gap-1" asChild>
                                <Link href={`/dashboard/flights/${flight.id}/ticket`}>
                                  <Download className="h-4 w-4" />
                                  Ticket
                                </Link>
                              </Button>
                              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" asChild>
                                <Link href={`/dashboard/flights/${flight.id}`}>
                                  Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Past Flights</h3>
                    <div className="space-y-4">
                      {pastFlights.map((flight) => (
                        <div key={flight.id} className="border rounded-lg p-4 hover:border-amber-500 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex gap-4 items-center">
                              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
                                <Plane className="h-6 w-6 text-gray-500" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{flight.route}</h4>
                                  <Badge variant="outline">Completed</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" /> 
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
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-auto">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/dashboard/flights/${flight.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Recommended Tab */}
          <TabsContent value="recommended" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Recommended Flights</CardTitle>
                <CardDescription>Personalized recommendations based on your profile and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* AI explanation */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">AI Matching:</span> These flights are recommended based on your travel preferences, 
                      professional background, and compatibility with potential travel companions. Our AI analyzes over 20 factors to find 
                      the best matches for your specific needs.
                    </p>
                  </div>
                  
                  {/* Recommended Flight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedFlights.map((flight) => (
                      <div key={flight.id} className="border rounded-lg overflow-hidden hover:border-amber-500 transition-colors">
                        <div className="relative h-40">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                          <Image 
                            src={flight.image} 
                            alt={flight.route} 
                            fill 
                            className="object-cover" 
                          />
                          <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
                            <h4 className="font-bold text-lg">{flight.route}</h4>
                            <p className="text-sm opacity-90">{flight.description}</p>
                          </div>
                          <div className="absolute top-2 right-2 z-20">
                            <Badge className="bg-amber-500 hover:bg-amber-600">{flight.matchScore}% Match</Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {formatDate(flight.date)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatTime(flight.date)}</span>
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {flight.companions} Compatible Companions</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{formatCurrency(flight.price)}</div>
                              <div className="text-xs text-muted-foreground">or {(flight.price / 5900).toFixed(1)} JET Tokens</div>
                            </div>
                            <Button className="bg-amber-500 hover:bg-amber-600 text-black" asChild>
                              <Link href={`/flights/book/${flight.id}`}>
                                Book Now
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 