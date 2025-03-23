"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Using the same type definitions as in the Pulse questionnaire
type TravelInterest = "Business" | "Sports" | "Tech" | "Art" | "Luxury" | "Music" | "Fashion" | "Crypto" | "Wellness" | "Family" | "Adventure";
type SocialPreference = "Networking" | "Privacy" | "Family-friendly" | "Social" | "Professional";
type UrgencyPreference = "Last-minute" | "Advanced" | "Exclusive";

const travelInterests: TravelInterest[] = ["Business", "Sports", "Tech", "Art", "Luxury", "Music", "Fashion", "Crypto", "Wellness", "Family", "Adventure"];
const socialPreferences: SocialPreference[] = ["Networking", "Privacy", "Family-friendly", "Social", "Professional"];
const popularDestinations = ["Cannes", "Miami", "Dubai", "New York", "London", "Monaco", "Tokyo", "Singapore", "Paris", "Las Vegas"];
const urgencyPreferences: UrgencyPreference[] = ["Last-minute", "Advanced", "Exclusive"];

export default function TravelPreferencesPage() {
  const { profile, loading, updateProfile } = useUserProfile();
  
  const [selectedInterests, setSelectedInterests] = useState<TravelInterest[]>([]);
  const [selectedSocialPrefs, setSelectedSocialPrefs] = useState<SocialPreference[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyPreference[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Check if we're in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
    
    // Hide navbar when in an iframe by adding a class to the body
    if (window.self !== window.top) {
      // Create and inject a style tag to hide the navbar when in an iframe
      const style = document.createElement('style');
      style.textContent = `
        nav { display: none !important; }
        header { display: none !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Load existing preferences
  useEffect(() => {
    if (profile?.travel_preferences) {
      const prefs = profile.travel_preferences;
      
      // Type assertion for type safety
      setSelectedInterests(prefs.travel_interests as TravelInterest[]);
      setSelectedSocialPrefs(prefs.social_preferences as SocialPreference[]);
      setSelectedDestinations(prefs.preferred_destinations);
      setSelectedUrgency(prefs.urgency_preferences as UrgencyPreference[]);
    }
  }, [profile]);

  const toggleInterest = (interest: TravelInterest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const toggleSocialPref = (pref: SocialPreference) => {
    if (selectedSocialPrefs.includes(pref)) {
      setSelectedSocialPrefs(selectedSocialPrefs.filter(p => p !== pref));
    } else {
      setSelectedSocialPrefs([...selectedSocialPrefs, pref]);
    }
  };

  const toggleDestination = (destination: string) => {
    if (selectedDestinations.includes(destination)) {
      setSelectedDestinations(selectedDestinations.filter(d => d !== destination));
    } else {
      setSelectedDestinations([...selectedDestinations, destination]);
    }
  };

  const toggleUrgency = (urgency: UrgencyPreference) => {
    if (selectedUrgency.includes(urgency)) {
      setSelectedUrgency(selectedUrgency.filter(u => u !== urgency));
    } else {
      setSelectedUrgency([...selectedUrgency, urgency]);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await updateProfile({
        travel_preferences: {
          user_id: profile.id,
          travel_interests: selectedInterests,
          social_preferences: selectedSocialPrefs,
          preferred_destinations: selectedDestinations,
          urgency_preferences: selectedUrgency,
        }
      });
      
      toast.success("Travel preferences updated successfully");
    } catch (error) {
      console.error("Error saving travel preferences:", error);
      toast.error("Failed to update travel preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isInIframe ? 'pt-0' : 'pt-4'}`}>
      {!isInIframe && (
        <div>
          <h3 className="text-lg font-medium">Travel Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize your travel preferences for JetStream Pulse recommendations and matching
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Travel Interests</CardTitle>
          <CardDescription>
            Select the areas that interest you most when traveling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {travelInterests.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedInterests.includes(interest) 
                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                    : "bg-background hover:bg-muted"
                }`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Preferences</CardTitle>
          <CardDescription>
            How do you prefer to travel and interact with others?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {socialPreferences.map((pref) => (
              <Badge
                key={pref}
                variant={selectedSocialPrefs.includes(pref) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedSocialPrefs.includes(pref) 
                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                    : "bg-background hover:bg-muted"
                }`}
                onClick={() => toggleSocialPref(pref)}
              >
                {pref}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferred Destinations</CardTitle>
          <CardDescription>
            Select your favorite destinations or places you'd like to visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularDestinations.map((destination) => (
              <Badge
                key={destination}
                variant={selectedDestinations.includes(destination) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedDestinations.includes(destination) 
                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                    : "bg-background hover:bg-muted"
                }`}
                onClick={() => toggleDestination(destination)}
              >
                {destination}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Preferences</CardTitle>
          <CardDescription>
            How do you prefer to be notified about flight opportunities?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedUrgency.includes("Last-minute") ? "default" : "outline"}
              className={`cursor-pointer ${
                selectedUrgency.includes("Last-minute") 
                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                  : "bg-background hover:bg-muted"
              }`}
              onClick={() => toggleUrgency("Last-minute")}
            >
              Notify me of last-minute specials
            </Badge>
            <Badge
              variant={selectedUrgency.includes("Advanced") ? "default" : "outline"}
              className={`cursor-pointer ${
                selectedUrgency.includes("Advanced") 
                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                  : "bg-background hover:bg-muted"
              }`}
              onClick={() => toggleUrgency("Advanced")}
            >
              Prefer advanced planning
            </Badge>
            <Badge
              variant={selectedUrgency.includes("Exclusive") ? "default" : "outline"}
              className={`cursor-pointer ${
                selectedUrgency.includes("Exclusive") 
                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                  : "bg-background hover:bg-muted"
              }`}
              onClick={() => toggleUrgency("Exclusive")}
            >
              Show me exclusive limited-time offers only
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="bg-amber-500 hover:bg-amber-600 text-white"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Preferences"
        )}
      </Button>
    </div>
  );
} 