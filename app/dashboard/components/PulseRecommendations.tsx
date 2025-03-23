"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Zap, 
  ArrowRight,
  Activity
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Flight } from "@/app/flights/types";
import { getJetImage } from "@/lib/utils/jet-images";

export default function PulseRecommendations() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [recommendations, setRecommendations] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch recommendations from API
        const response = await fetch("/api/flights");
        
        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }
        
        const flights = await response.json();
        
        // Sort by price (higher price = more exclusive = higher match)
        // In a real application, this would use the AI matching score from Cohere/Pinecone
        const sortedFlights = [...flights]
          .sort((a, b) => b.base_price - a.base_price)
          .slice(0, 3); // Just show top 3
          
        setRecommendations(sortedFlights);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [user]);

  // Calculate match score based on price (higher price = higher score for this demo)
  const calculateMatchScore = (price: number): number => {
    const maxPrice = 25000; // Assumed max price
    const minScore = 85; // Minimum score we want to show
    const score = Math.min(98, minScore + ((price / maxPrice) * (100 - minScore)));
    return Math.round(score);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2 text-amber-500" />
            JetStream Pulse Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2 text-amber-500" />
            JetStream Pulse Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">
              Complete your travel preferences to get personalized flight recommendations.
            </p>
            <Button asChild>
              <Link href="/pulse">Set Your Preferences</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Activity className="w-5 h-5 mr-2 text-amber-500" />
          JetStream Pulse Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-0 divide-y">
          {recommendations.map((flight) => {
            const matchScore = calculateMatchScore(flight.base_price);
            const jetImage = getJetImage(flight.jets, 0);
            
            return (
              <div key={flight.id} className="flex items-start p-4 hover:bg-muted/50 transition-colors">
                <div 
                  className="w-16 h-16 rounded-md bg-center bg-cover mr-4 flex-shrink-0"
                  style={{ 
                    backgroundImage: `url(${jetImage})` 
                  }}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold truncate">
                      {flight.origin?.city} → {flight.destination?.city}
                    </h3>
                    <Badge className="ml-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40">
                      {matchScore}% Match
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>{formatDate(flight.departure_time)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm font-medium">
                      {formatCurrency(flight.base_price)}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                      <Link href={`/flights?id=${flight.id}`}>
                        Book Now
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="border-t px-4 py-3">
        <Button variant="ghost" size="sm" className="ml-auto text-xs" asChild>
          <Link href="/pulse">
            View All Pulse Flights
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 