"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CrewMember } from '@/lib/types/crew.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ReviewForm } from '../components/review-form';
import { Icons } from '@/components/icons';
import { Star, Calendar, User, MapPin, Clock, ExternalLink, Heart } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils/format';
import { useEffect } from 'react';

interface CrewDetailClientProps {
  crew: CrewMember;
}

export default function CrewDetailClient({ crew }: CrewDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [updatedCrew, setUpdatedCrew] = useState<CrewMember>(crew);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  // Listen for review submissions from the form component
  useEffect(() => {
    const handleReviewSubmitted = (event: CustomEvent) => {
      const { crew, tab } = event.detail;
      setUpdatedCrew(crew);
      setActiveTab(tab);
    };
    
    window.addEventListener('crew-review-submitted', handleReviewSubmitted as EventListener);
    
    return () => {
      window.removeEventListener('crew-review-submitted', handleReviewSubmitted as EventListener);
    };
  }, []);
  
  const [imageError, setImageError] = useState(false);
  const [headerImageError, setHeaderImageError] = useState(false);
  
  // Generate placeholder image or use profile image
  const getProfileImageUrl = () => {
    if (!updatedCrew.profileImageUrl) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedCrew.name)}&background=FF9500&color=fff&size=200`;
    }
    
    // Check if the profile image is a relative path or already a full URL
    if (updatedCrew.profileImageUrl.startsWith('http')) {
      // Check if it's an Unsplash URL that might be causing issues
      if (updatedCrew.profileImageUrl.includes('source.unsplash.com')) {
        // If we're seeing this pattern, use a UI avatar instead
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedCrew.name)}&background=FF9500&color=fff&size=200`;
      }
      return updatedCrew.profileImageUrl;
    } else {
      // For relative paths, just return the path as is
      // The database should now contain the complete path with extension
      return updatedCrew.profileImageUrl;
    }
  };
  
  // Generate header image URL - looking for _2 suffix or using the same as profile
  const getHeaderImageUrl = () => {
    const profileUrl = getProfileImageUrl();
    
    // If it's already a generated avatar or remote URL, use the same for header
    if (profileUrl.startsWith('http')) {
      return profileUrl;
    }
    
    // Try to generate a _2 version of the image
    // For example: /images/crew/captain_reid.jpg -> /images/crew/captain_reid_2.jpg
    
    // Parse the URL to separate path and extension
    const lastDotIndex = profileUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const path = profileUrl.substring(0, lastDotIndex);
      const extension = profileUrl.substring(lastDotIndex);
      return `${path}_2${extension}`;
    }
    
    // If no extension in the URL, just append _2
    return `${profileUrl}_2`;
  };
  
  const profileImage = imageError 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedCrew.name)}&background=FF9500&color=fff&size=200`
    : getProfileImageUrl();
    
  const headerImage = headerImageError ? profileImage : getHeaderImageUrl();
  
  // Format rating to show one decimal place
  const formattedRating = updatedCrew.ratingsAvg ? updatedCrew.ratingsAvg.toFixed(1) : 'New';
  
  // Get reviews
  const reviews = updatedCrew.reviews || [];
  
  // Get specialized flights
  const specializedFlights = updatedCrew.specializedFlights || [];
  
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Profile images */}
        <div className="w-full md:w-1/3">
          <div className="rounded-lg overflow-hidden">
            <div className="relative w-full aspect-square">
              <Image
                src={activeImage || headerImage}
                alt={updatedCrew.name}
                fill
                className="object-cover"
                priority
                onError={() => setHeaderImageError(true)}
              />
            </div>
          </div>
          
          {/* Thumbnails row */}
          <div className="mt-4 flex gap-2">
            <button 
              className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${activeImage === headerImage || !activeImage ? 'border-amber-500 shadow-md' : 'border-gray-200 hover:border-amber-300'}`}
              onClick={() => setActiveImage(headerImage)}
            >
              <Image
                src={headerImage}
                alt={`${updatedCrew.name} header image`}
                fill
                className="object-cover"
                onError={() => setHeaderImageError(true)}
              />
            </button>
            
            <button 
              className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${activeImage === profileImage ? 'border-amber-500 shadow-md' : 'border-gray-200 hover:border-amber-300'}`}
              onClick={() => setActiveImage(profileImage)}
            >
              <Image
                src={profileImage}
                alt={`${updatedCrew.name} profile image`}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </button>
          </div>
        </div>
        
        {/* Right column - Profile info */}
        <div className="w-full md:w-2/3 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{updatedCrew.name}</h1>
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
                  <span>Specializations: {updatedCrew.specializations.length}</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => router.push(`/crew/request?crewId=${updatedCrew.id}`)}
            >
              Request Custom Flight
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {updatedCrew.specializations.map((specialization) => (
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
                  <CardTitle>About {updatedCrew.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {updatedCrew.bio || `${updatedCrew.name} is a specialized crew member offering unique experiences during your private jet flights.`}
                  </p>
                  
                  {updatedCrew.socialLinks && Object.values(updatedCrew.socialLinks).some(link => link) && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="text-lg font-semibold mb-4">Connect with {updatedCrew.name.split(' ')[0]}</h3>
                      <div className="flex flex-wrap gap-3">
                        {updatedCrew.socialLinks.twitter && (
                          <a 
                            href={`https://twitter.com/${updatedCrew.socialLinks.twitter.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-500 hover:underline"
                          >
                            <Icons.twitter className="w-5 h-5 mr-1" />
                            <span>Twitter</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                        
                        {updatedCrew.socialLinks.linkedin && (
                          <a 
                            href={updatedCrew.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-700 hover:underline"
                          >
                            <Icons.linkedin className="w-5 h-5 mr-1" />
                            <span>LinkedIn</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                        
                        {updatedCrew.socialLinks.instagram && (
                          <a 
                            href={`https://instagram.com/${updatedCrew.socialLinks.instagram.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-pink-600 hover:underline"
                          >
                            <Icons.instagram className="w-5 h-5 mr-1" />
                            <span>Instagram</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                        
                        {updatedCrew.socialLinks.website && (
                          <a 
                            href={updatedCrew.socialLinks.website} 
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
                <ReviewForm 
                  onSubmitReview={`
                    async function(rating, comment) {
                      try {
                        const response = await fetch('/api/crew-reviews', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            crewId: "${updatedCrew.id}",
                            rating,
                            reviewText: comment
                          }),
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || 'Failed to submit review');
                        }
                        
                        // Refetch crew data to get updated reviews and rating
                        const crewResponse = await fetch('/api/crew/${updatedCrew.id}');
                        const crewData = await crewResponse.json();
                        
                        // This function is running in a separate context, so we need to use the window
                        // to communicate with the React component
                        window.dispatchEvent(new CustomEvent('crew-review-submitted', {
                          detail: {
                            crew: crewData.crew,
                            tab: 'reviews'
                          }
                        }));
                      } catch (err) {
                        console.error('Error submitting review:', err);
                        alert(err.message || 'An error occurred while submitting your review');
                      }
                    }
                  `}
                  isSubmitting={isSubmittingReview} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="flights" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Specialized Flights</CardTitle>
                  <CardDescription>
                    Flights featuring {updatedCrew.name}'s unique experiences
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
                    What travelers are saying about {updatedCrew.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage 
                                src={review.user?.avatarUrl || undefined} 
                                onError={(e) => {
                                  // Fallback to avatar fallback if image fails to load
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
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
                      <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review {updatedCrew.name}!</p>
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