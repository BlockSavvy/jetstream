"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CrewMember, CrewReview, SpecializedFlight } from '@/lib/types/crew.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewForm } from '../components/review-form';
import { Icons } from '@/components/icons';
import { Star, Calendar, User, MapPin, Clock, Loader2, ExternalLink, Heart } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils/format';

interface CrewDetailPageProps {
  params: {
    id: string;
  };
}

export default function CrewDetailPage({ params }: CrewDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  
  const [crew, setCrew] = useState<CrewMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Fetch crew data
  useEffect(() => {
    const fetchCrewData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/crew/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Crew member not found');
          }
          throw new Error('Failed to fetch crew member data');
        }
        
        const data = await response.json();
        setCrew(data.crew);
      } catch (err: any) {
        console.error('Error fetching crew data:', err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCrewData();
    }
  }, [id]);
  
  // Submit a review
  const handleSubmitReview = async (rating: number, comment: string) => {
    try {
      setIsSubmittingReview(true);
      
      const response = await fetch('/api/crew-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crewId: id,
          rating,
          reviewText: comment
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
      
      // Refetch crew data to get updated reviews and rating
      const crewResponse = await fetch(`/api/crew/${id}`);
      const crewData = await crewResponse.json();
      setCrew(crewData.crew);
      
      // Switch to reviews tab
      setActiveTab('reviews');
    } catch (err: any) {
      console.error('Error submitting review:', err);
      alert(err.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-16 space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }
  
  if (error || !crew) {
    return (
      <div className="container py-16 text-center space-y-6">
        <h2 className="text-2xl font-bold">{error || 'Crew member not found'}</h2>
        <Button onClick={() => router.push('/crew')} variant="outline">
          Back to Crew Listing
        </Button>
      </div>
    );
  }
  
  // Generate placeholder image or use profile image
  const profileImage = crew.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(crew.name)}&background=FF9500&color=fff&size=200`;
  
  // Format rating to show one decimal place
  const formattedRating = crew.ratingsAvg ? crew.ratingsAvg.toFixed(1) : 'New';
  
  // Get reviews
  const reviews = crew.reviews || [];
  
  // Get specialized flights
  const specializedFlights = crew.specializedFlights || [];
  
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Profile image */}
        <div className="w-full md:w-1/3">
          <div className="rounded-lg overflow-hidden">
            <div className="relative w-full aspect-square">
              <Image
                src={profileImage}
                alt={crew.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
        
        {/* Right column - Profile info */}
        <div className="w-full md:w-2/3 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{crew.name}</h1>
              <div className="flex items-center mt-2 text-muted-foreground">
                <div className="flex items-center mr-4">
                  <Star className="w-5 h-5 text-amber-500 mr-1 fill-amber-500" />
                  <span className="font-medium">{formattedRating}</span>
                  {reviews.length > 0 && (
                    <span className="ml-1">({reviews.length} reviews)</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>Specializations: {crew.specializations.length}</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => router.push(`/crew/request?crewId=${id}`)}
            >
              Request Custom Flight
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {crew.specializations.map((specialization) => (
              <Badge key={specialization} variant="secondary">
                {specialization}
              </Badge>
            ))}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="flights">Flights</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About {crew.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {crew.bio || `${crew.name} is a specialized crew member offering unique experiences during your private jet flights.`}
                  </p>
                  
                  {crew.socialLinks && Object.values(crew.socialLinks).some(link => link) && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="text-lg font-semibold mb-4">Connect with {crew.name.split(' ')[0]}</h3>
                      <div className="flex flex-wrap gap-3">
                        {crew.socialLinks.twitter && (
                          <a 
                            href={`https://twitter.com/${crew.socialLinks.twitter.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-500 hover:underline"
                          >
                            <Icons.twitter className="w-5 h-5 mr-1" />
                            <span>Twitter</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                        
                        {crew.socialLinks.linkedin && (
                          <a 
                            href={crew.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-700 hover:underline"
                          >
                            <Icons.linkedin className="w-5 h-5 mr-1" />
                            <span>LinkedIn</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                        
                        {crew.socialLinks.instagram && (
                          <a 
                            href={`https://instagram.com/${crew.socialLinks.instagram.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-pink-600 hover:underline"
                          >
                            <Icons.instagram className="w-5 h-5 mr-1" />
                            <span>Instagram</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                        
                        {crew.socialLinks.website && (
                          <a 
                            href={crew.socialLinks.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-gray-700 hover:underline"
                          >
                            <Icons.globe className="w-5 h-5 mr-1" />
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <ReviewForm onSubmit={handleSubmitReview} isSubmitting={isSubmittingReview} />
              </div>
            </TabsContent>
            
            <TabsContent value="flights" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Specialized Flights</CardTitle>
                  <CardDescription>
                    Flights featuring {crew.name}'s unique experiences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {specializedFlights.length > 0 ? (
                    <div className="space-y-6">
                      {specializedFlights.map((flight) => (
                        <div key={flight.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold">{flight.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{flight.theme}</p>
                            </div>
                            <Badge>{flight.seatsAvailable} seats</Badge>
                          </div>
                          
                          {flight.flight && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="flex items-center text-sm">
                                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span>
                                  {flight.flight.origin?.city || flight.flight.origin_airport} to {flight.flight.destination?.city || flight.flight.destination_airport}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span>
                                  {formatDate(flight.flight.departure_time)}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span>
                                  {formatTime(flight.flight.departure_time)}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Heart className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span>
                                  {flight.flight.jets?.model || 'Private Jet'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {flight.description || 'Join this specialized flight for a unique experience with our crew.'}
                            </p>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Link href={`/flights/${flight.flightId}`}>
                              <Button variant="outline">View Flight</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No specialized flights scheduled at the moment.</p>
                      <Button variant="outline">Request a Custom Flight</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                  <CardDescription>
                    What travelers are saying about {crew.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.user?.avatarUrl || undefined} />
                              <AvatarFallback className="bg-amber-100 text-amber-800">
                                {review.user?.name ? review.user.name.charAt(0) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-medium">{review.user?.name || 'Anonymous'}</h4>
                                <div className="ml-4 flex items-center">
                                  {Array(5).fill(0).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                              <p className="mt-2">
                                {review.reviewText || 'Great experience!'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review {crew.name}!</p>
                      <Button onClick={() => setActiveTab('about')} variant="outline">
                        Write a Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 