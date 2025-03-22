'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Plane,
  Users,
  ArrowRight,
  Clock,
  Briefcase,
  Building,
  Check,
  X,
  ChevronRight,
  Loader,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

type MatchResult = {
  id: string;
  route: string;
  departure: string;
  matchScore: number;
  reasons: string[];
  price: number;
  companions: number;
  metadata?: any;
};

export default function AIMatchingTestPage() {
  const [query, setQuery] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(70);
  const [includeNetworking, setIncludeNetworking] = useState(true);
  const [includeFamilyFriendly, setIncludeFamilyFriendly] = useState(false);
  const [includeBusinessClass, setIncludeBusinessClass] = useState(true);
  
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('natural');
  
  // Example filtered queries based on the checkboxes
  const networkingQueries = [
    'Find business travelers in technology industry flying from NYC',
    'Match me with finance professionals flying to London next month',
    'Connect with entrepreneurs on flights to San Francisco',
    'Find venture capital investors on morning flights from Boston',
  ];
  
  const familyQueries = [
    'Family-friendly flights to Orlando with other families',
    'Quiet flights with minimal business travelers',
    'Morning flights with family amenities to vacation destinations',
    'Flights with other families with young children',
  ];
  
  const businessQueries = [
    'First class flights with meeting facilities and Wi-Fi',
    'Business class flights to major financial centers',
    'Red-eye flights with sleep amenities for business travelers',
    'Direct flights to tech hubs with other executives',
  ];
  
  const handleQuerySuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      // Build filters based on UI selections
      const filters: any = {};
      
      if (departureCity) {
        filters.origin = departureCity;
      }
      
      if (destinationCity) {
        filters.destination = destinationCity;
      }
      
      if (minMatchScore > 0) {
        filters.minScore = minMatchScore / 100; // Convert to 0-1 range for vector search
      }
      
      // Call your AI matching API with filters
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          filters
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get matching results');
      }
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">AI Matching Test Lab</h1>
      <p className="text-gray-500 mb-8">Experiment with our AI matching algorithm to find compatible flights and travelers</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Matching Settings</CardTitle>
              <CardDescription>
                Customize your matching preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="natural">Natural Language</TabsTrigger>
                  <TabsTrigger value="structured">Structured Query</TabsTrigger>
                </TabsList>
                
                <TabsContent value="natural" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="query">Natural Language Query</Label>
                      <Textarea
                        id="query"
                        placeholder="Describe what you're looking for in a flight and companions..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Example: "Find business travelers in technology flying from NYC to SF next week"
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Label className="mb-2 block">Suggested Queries:</Label>
                      <div className="space-y-2">
                        {includeNetworking && (
                          <div>
                            <Badge variant="outline" className="mb-2">Networking</Badge>
                            <div className="grid grid-cols-1 gap-2">
                              {networkingQueries.map((q, i) => (
                                <Button 
                                  key={i} 
                                  variant="outline" 
                                  className="justify-start h-auto py-2 px-3 text-left font-normal"
                                  onClick={() => handleQuerySuggestion(q)}
                                >
                                  {q}
                                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {includeFamilyFriendly && (
                          <div className="mt-3">
                            <Badge variant="outline" className="mb-2">Family-Friendly</Badge>
                            <div className="grid grid-cols-1 gap-2">
                              {familyQueries.map((q, i) => (
                                <Button 
                                  key={i} 
                                  variant="outline" 
                                  className="justify-start h-auto py-2 px-3 text-left font-normal"
                                  onClick={() => handleQuerySuggestion(q)}
                                >
                                  {q}
                                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {includeBusinessClass && (
                          <div className="mt-3">
                            <Badge variant="outline" className="mb-2">Business Class</Badge>
                            <div className="grid grid-cols-1 gap-2">
                              {businessQueries.map((q, i) => (
                                <Button 
                                  key={i} 
                                  variant="outline" 
                                  className="justify-start h-auto py-2 px-3 text-left font-normal"
                                  onClick={() => handleQuerySuggestion(q)}
                                >
                                  {q}
                                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : 'Run Matching Test'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="structured" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="departureCity">Departure City</Label>
                        <Input
                          id="departureCity"
                          placeholder="e.g. New York, Boston"
                          value={departureCity}
                          onChange={(e) => setDepartureCity(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="destinationCity">Destination City</Label>
                        <Input
                          id="destinationCity"
                          placeholder="e.g. San Francisco, Miami"
                          value={destinationCity}
                          onChange={(e) => setDestinationCity(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="minMatchScore">Minimum Match Score</Label>
                          <span className="text-sm">{minMatchScore}%</span>
                        </div>
                        <Slider
                          id="minMatchScore"
                          min={0}
                          max={100}
                          step={5}
                          value={[minMatchScore]}
                          onValueChange={(values) => setMinMatchScore(values[0])}
                          className="py-4"
                        />
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="space-y-2">
                        <Label className="mb-2 block">Traveler Type</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="includeNetworking" 
                              checked={includeNetworking}
                              onCheckedChange={(checked) => setIncludeNetworking(checked as boolean)}
                            />
                            <Label htmlFor="includeNetworking" className="font-normal">Business Networking</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="includeFamilyFriendly" 
                              checked={includeFamilyFriendly}
                              onCheckedChange={(checked) => setIncludeFamilyFriendly(checked as boolean)}
                            />
                            <Label htmlFor="includeFamilyFriendly" className="font-normal">Family-Friendly</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="includeBusinessClass" 
                              checked={includeBusinessClass}
                              onCheckedChange={(checked) => setIncludeBusinessClass(checked as boolean)}
                            />
                            <Label htmlFor="includeBusinessClass" className="font-normal">Business Class</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : 'Run Matching Test'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Plane className="mr-2 h-5 w-5" />
                Matching Results
              </CardTitle>
              <CardDescription>
                Flights and companions that match your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-amber-500 mb-4" />
                  <p className="text-muted-foreground">Processing your query...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-6">
                  {results.map((result) => (
                    <Card key={result.id} className="overflow-hidden border-2 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative md:w-1/3 bg-gradient-to-br from-amber-100 to-amber-50 p-6 flex flex-col justify-between">
                          <div>
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-amber-500 text-black font-bold">
                                {result.matchScore}% Match
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold">{result.route}</h3>
                            <div className="flex items-center mt-2 text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(result.departure).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="flex items-center mt-1 text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {new Date(result.departure).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="flex items-center mt-1 text-gray-600">
                              <Users className="h-4 w-4 mr-2" />
                              {result.companions} compatible travelers
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="text-xl font-bold text-amber-800">
                              ${result.price.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Per seat or fractional token
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-6 md:flex-1">
                          <h4 className="font-medium mb-2">Why this matches you:</h4>
                          <ul className="space-y-2">
                            {result.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {result.metadata && result.metadata.professionals && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">Professional Matches:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {result.metadata.professionals.map((pro: any, i: number) => (
                                  <div key={i} className="flex items-center p-2 rounded-md bg-gray-50">
                                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                                    <div>
                                      <div className="text-sm font-medium">{pro.jobTitle}</div>
                                      <div className="text-xs text-gray-500">{pro.industry}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {result.metadata && result.metadata.jetModel && (
                            <div className="flex items-center mt-4 text-gray-600">
                              <Plane className="h-4 w-4 mr-2" />
                              <span className="text-sm">{result.metadata.jetModel}</span>
                            </div>
                          )}
                          
                          {result.metadata && result.metadata.amenities && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {result.metadata.amenities.split(',').map((amenity: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {amenity.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-6 flex justify-end">
                            <Link href={`/flights?details=${result.id}`}>
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
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plane className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No matches found</h3>
                  <p className="text-muted-foreground max-w-md">
                    Enter a query to find flights and compatible travelers based on your preferences.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 