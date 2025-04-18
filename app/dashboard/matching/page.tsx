'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  Plane,
  Users,
  ArrowRight,
  Clock,
  Briefcase,
  Building,
  Check,
  Search,
  Loader,
  MapPin,
  Star,
  Filter,
  User,
  Sparkles,
  Globe,
  MessageSquare,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'

// Mock recommended matches (would come from API in production)
const recommendedMatches = [
  {
    id: '1',
    route: 'New York → San Francisco',
    departure: '2023-06-20T09:30:00',
    matchScore: 98,
    price: 12500,
    companions: 4,
    reasons: [
      'Matches your preferred departure from New York',
      'Matches your preference for San Francisco destinations',
      'Morning departure time (09:30 AM)',
      '4 compatible travelers with similar interests',
      'Includes preferred amenities: Wi-Fi, Premium Dining',
      'Preferred aircraft type: Gulfstream G650',
      'Exceptional match for your travel preferences and style'
    ],
    metadata: {
      origin: 'New York',
      destination: 'San Francisco',
      departureTime: '2023-06-20T09:30:00',
      jetModel: 'G650',
      manufacturer: 'Gulfstream',
      amenities: 'Wi-Fi, Premium Dining, Meeting Facilities, Sleep Suite',
      professionals: [
        { jobTitle: 'CEO', industry: 'Technology', company: 'TechVision Inc.' },
        { jobTitle: 'VC Partner', industry: 'Finance', company: 'Sequoia Capital' },
        { jobTitle: 'Marketing Director', industry: 'Technology', company: 'Apple' }
      ]
    },
    image: '/images/jets/gulfstream/g650.jpg'
  },
  {
    id: '2',
    route: 'New York → Miami',
    departure: '2023-07-05T14:15:00',
    matchScore: 92,
    price: 9700,
    companions: 3,
    reasons: [
      'Matches your preferred departure from New York',
      'Popular destination among your network',
      'Afternoon departure time (02:15 PM)',
      '3 compatible travelers with similar interests',
      'Includes preferred amenities: Wi-Fi, Premium Dining',
      'Very strong match for your requirements'
    ],
    metadata: {
      origin: 'New York',
      destination: 'Miami',
      departureTime: '2023-07-05T14:15:00',
      jetModel: 'Global 6000',
      manufacturer: 'Bombardier',
      amenities: 'Wi-Fi, Premium Dining, Entertainment System, Bar Service',
      professionals: [
        { jobTitle: 'Investment Director', industry: 'Finance', company: 'BlackRock' },
        { jobTitle: 'Real Estate Developer', industry: 'Real Estate', company: 'Luxury Properties' }
      ]
    },
    image: '/images/jets/bombardier/Global6000.jpg'
  },
  {
    id: '3',
    route: 'New York → Las Vegas',
    departure: '2023-07-15T11:00:00',
    matchScore: 88,
    price: 11200,
    companions: 5,
    reasons: [
      'Matches your preferred departure from New York',
      'Growing interest in your network',
      'Morning departure time (11:00 AM)',
      '5 compatible travelers with similar interests',
      'Preferred aircraft type: Embraer Praetor 600',
      'Very strong match for your requirements'
    ],
    metadata: {
      origin: 'New York',
      destination: 'Las Vegas',
      departureTime: '2023-07-15T11:00:00',
      jetModel: 'Praetor 600',
      manufacturer: 'Embraer',
      amenities: 'Wi-Fi, Entertainment System, Premium Dining, Workspace',
      professionals: [
        { jobTitle: 'Media Executive', industry: 'Entertainment', company: 'Universal Studios' },
        { jobTitle: 'Hotel Developer', industry: 'Hospitality', company: 'Marriott International' },
        { jobTitle: 'Tech Entrepreneur', industry: 'Technology', company: 'NextGen Innovations' }
      ]
    },
    image: '/images/jets/embraer/Praetor600.jpg'
  }
];

// Enhanced traveler profiles with more detailed information
const compatibleTravelers = [
  {
    id: '1',
    name: 'Alex Marshall',
    jobTitle: 'CEO',
    company: 'TechVision Inc.',
    industry: 'Technology',
    matchScore: 96,
    bio: 'Serial entrepreneur with 3 successful exits. Passionate about AI and blockchain.',
    interests: ['Technology', 'Investments', 'Golf', 'Wine'],
    route: 'New York → San Francisco',
    departure: '2023-06-20T09:30:00',
    image: '/images/profile/alex.svg',
    travelFrequency: 'Weekly',
    networkSize: 'Large',
    connectionValue: 'High'
  },
  {
    id: '2',
    name: 'Sophia Chen',
    jobTitle: 'VC Partner',
    company: 'Sequoia Capital',
    industry: 'Finance',
    matchScore: 94,
    bio: 'Early-stage investor focused on AI, Web3, and sustainability technologies.',
    interests: ['Venture Capital', 'Startups', 'Tennis', 'Fine Dining'],
    route: 'New York → San Francisco',
    departure: '2023-06-20T09:30:00',
    image: '/images/profile/sophia.svg',
    travelFrequency: 'Bi-weekly',
    networkSize: 'Very Large',
    connectionValue: 'Very High'
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    jobTitle: 'Investment Director',
    company: 'BlackRock',
    industry: 'Finance',
    matchScore: 91,
    bio: 'Experienced asset manager specializing in tech and real estate investments.',
    interests: ['Finance', 'Real Estate', 'Sailing', 'Classical Music'],
    route: 'New York → Miami',
    departure: '2023-07-05T14:15:00',
    image: '/images/profile/marcus.svg',
    travelFrequency: 'Monthly',
    networkSize: 'Large',
    connectionValue: 'High'
  },
  {
    id: '4',
    name: 'Olivia Rodriguez',
    jobTitle: 'Marketing Director',
    company: 'Apple',
    industry: 'Technology',
    matchScore: 89,
    bio: 'Creative marketing executive with expertise in luxury and tech branding.',
    interests: ['Marketing', 'Design', 'Yoga', 'Modern Art'],
    route: 'New York → San Francisco',
    departure: '2023-06-20T09:30:00',
    image: '/images/profile/olivia.svg',
    travelFrequency: 'Bi-weekly',
    networkSize: 'Medium',
    connectionValue: 'Medium'
  },
  {
    id: '5',
    name: 'James Wilson',
    jobTitle: 'Real Estate Developer',
    company: 'Luxury Properties',
    industry: 'Real Estate',
    matchScore: 86,
    bio: 'Leading luxury property developer with projects in Miami, New York, and Dubai.',
    interests: ['Architecture', 'Investments', 'Golf', 'Boating'],
    route: 'New York → Miami',
    departure: '2023-07-05T14:15:00',
    image: '/images/profile/james.svg',
    travelFrequency: 'Weekly',
    networkSize: 'Medium',
    connectionValue: 'High'
  },
  {
    id: '6',
    name: 'Emma Davis',
    jobTitle: 'Media Executive',
    company: 'Universal Studios',
    industry: 'Entertainment',
    matchScore: 84,
    bio: 'Entertainment industry veteran with extensive connections in Hollywood.',
    interests: ['Film', 'Media', 'Skiing', 'Food & Wine'],
    route: 'New York → Las Vegas',
    departure: '2023-07-15T11:00:00',
    image: '/images/profile/emma.svg',
    travelFrequency: 'Monthly',
    networkSize: 'Very Large',
    connectionValue: 'Very High'
  }
];

export default function AIMatchingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('recommendations')
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setActiveTab('custom')
    }, 1500)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Flight Matching</h1>
          <p className="text-muted-foreground">
            Discover flights and travel companions based on your profile, preferences, and professional network
          </p>
        </div>
        <Button variant="outline" className="gap-1 mb-2" asChild>
          <Link href="/test/ai-matching">
            <Sparkles className="h-4 w-4 mr-1 text-amber-500" /> 
            Advanced Matching Lab
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Find Your Perfect Match</CardTitle>
            <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Natural language search..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                className="ml-2 bg-amber-500 hover:bg-amber-600 text-black"
                disabled={loading}
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>
          </div>
          <CardDescription>
            Try: "Find business travelers in tech flying to San Francisco next month"
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations" className="flex gap-2 items-center">
            <Star className="h-4 w-4" />
            <span>Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex gap-2 items-center">
            <Filter className="h-4 w-4" />
            <span>Custom Matches</span>
          </TabsTrigger>
          <TabsTrigger value="companions" className="flex gap-2 items-center">
            <User className="h-4 w-4" />
            <span>Compatible Travelers</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedMatches.map((match) => (
              <Card key={match.id} className="overflow-hidden">
                <div className="relative h-48">
                  <Image 
                    src={match.image} 
                    alt={match.route} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                      {match.matchScore}% Match
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{match.route}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      <span className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 opacity-75" />
                        {formatDate(match.departure)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 opacity-75" />
                        {formatTime(match.departure)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {match.companions} compatible travelers
                      </span>
                    </div>
                    <div className="font-semibold">{formatCurrency(match.price)}</div>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-2">Key Match Factors:</h4>
                  <ul className="text-sm space-y-1">
                    {match.reasons.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="px-4 py-3 border-t bg-muted/50 flex justify-between">
                  <div className="flex gap-2">
                    {match.metadata.professionals && match.metadata.professionals.slice(0, 2).map((pro, i) => (
                      <div key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                        <Briefcase className="h-3 w-3 mr-1 text-muted-foreground" />
                        {pro.industry}
                      </div>
                    ))}
                  </div>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black" asChild>
                    <Link href={`/dashboard/matching/${match.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4">
          {searchQuery ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Results for "{searchQuery}"</h3>
                  <p className="text-sm text-muted-foreground">Showing custom matches based on your query</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setSearchQuery('')}>
                  <Filter className="h-3.5 w-3.5" />
                  Modify Search
                </Button>
              </div>
              
              <div className="space-y-4">
                {recommendedMatches.map((match) => (
                  <Card key={match.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-1/3 bg-gradient-to-br from-amber-100 to-amber-50 p-6 flex flex-col justify-between">
                        <div>
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-amber-500 text-black font-bold">
                              {match.matchScore - Math.floor(Math.random() * 10)}% Match
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold">{match.route}</h3>
                          <div className="flex items-center mt-2 text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(match.departure)}
                          </div>
                          <div className="flex items-center mt-1 text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {formatTime(match.departure)}
                          </div>
                          <div className="flex items-center mt-1 text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {match.companions} compatible travelers
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="text-xl font-bold text-amber-800">
                            ${(match.price * 0.9).toLocaleString()}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Per seat or fractional token
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 md:flex-1">
                        <h4 className="font-medium mb-2">Why this matches your search:</h4>
                        <ul className="space-y-2">
                          {match.reasons.slice(0, 4).map((reason, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {match.metadata.professionals && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Professional Matches:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {match.metadata.professionals.map((pro, i) => (
                                <div key={i} className="flex items-center p-2 rounded-md bg-gray-50">
                                  <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                                  <div>
                                    <div className="text-sm font-medium">{pro.jobTitle}</div>
                                    <div className="text-xs text-gray-500">{pro.industry} - {pro.company}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 flex justify-end">
                          <Link href={`/dashboard/matching/${match.id}`}>
                            <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                              View Details
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start with a search</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Use natural language to describe your ideal flight experience, destinations, 
                or the type of travelers you'd like to connect with.
              </p>
              <div className="flex gap-2 flex-wrap max-w-lg justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("Entrepreneurs flying to San Francisco next month")}
                  className="text-xs"
                >
                  Entrepreneurs flying to San Francisco
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("Family-friendly flight to Orlando in July")}
                  className="text-xs"
                >
                  Family-friendly flight to Orlando
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("Tech executives flying from NYC to Seattle")}
                  className="text-xs"
                >
                  Tech executives NYC to Seattle
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="companions" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Compatible Travelers</h3>
                <p className="text-sm text-muted-foreground">Network with professionals who share your travel patterns</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link href="/dashboard/settings/preferences">
                  Update Preferences
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compatibleTravelers.map((person) => (
                <Card key={person.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="rounded-full overflow-hidden h-16 w-16 bg-gradient-to-br from-amber-100 to-amber-300">
                          <Image 
                            src={person.image} 
                            alt={person.name}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1">
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs">
                            {person.matchScore}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">{person.name}</h4>
                        <p className="text-sm font-medium text-muted-foreground">
                          {person.jobTitle}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-amber-600 font-medium">
                          <Building className="h-3 w-3 mr-1 inline" />
                          <span>{person.company}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-xs bg-muted p-2 rounded-md">
                        <span className="text-muted-foreground">Industry:</span>
                        <div className="font-medium truncate">{person.industry}</div>
                      </div>
                      <div className="text-xs bg-muted p-2 rounded-md">
                        <span className="text-muted-foreground">Travels:</span>
                        <div className="font-medium truncate">{person.travelFrequency}</div>
                      </div>
                      <div className="text-xs bg-muted p-2 rounded-md col-span-2">
                        <span className="text-muted-foreground">Interests:</span>
                        <div className="font-medium truncate">{person.interests.join(', ')}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {person.bio}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                      <Plane className="h-3 w-3 mr-1 inline" />
                      <span className="truncate">{person.route}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between px-4 py-3 border-t bg-muted/50">
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <Share2 className="h-3 w-3" />
                      Connect
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard/network">
                  View All Compatible Travelers
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 