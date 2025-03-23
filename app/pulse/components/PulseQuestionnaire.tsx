"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

// Define the question types
type TravelInterest = "Business" | "Sports" | "Tech" | "Art" | "Luxury" | "Music" | "Fashion" | "Crypto" | "Wellness" | "Family" | "Adventure";
type SocialPreference = "Networking" | "Privacy" | "Family-friendly" | "Social" | "Professional";
type UrgencyPreference = "Last-minute" | "Advanced" | "Exclusive";

const travelInterests: TravelInterest[] = ["Business", "Sports", "Tech", "Art", "Luxury", "Music", "Fashion", "Crypto", "Wellness", "Family", "Adventure"];
const socialPreferences: SocialPreference[] = ["Networking", "Privacy", "Family-friendly", "Social", "Professional"];
const popularDestinations = ["Cannes", "Miami", "Dubai", "New York", "London", "Monaco", "Tokyo", "Singapore", "Paris", "Las Vegas"];
const urgencyPreferences: UrgencyPreference[] = ["Last-minute", "Advanced", "Exclusive"];

export default function PulseQuestionnaire() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<TravelInterest[]>([]);
  const [selectedSocialPrefs, setSelectedSocialPrefs] = useState<SocialPreference[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyPreference[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Load existing preferences from profile if available
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (user) {
        // Save preferences to user profile
        await updateProfile({
          travel_preferences: {
            user_id: user.id,
            travel_interests: selectedInterests,
            social_preferences: selectedSocialPrefs,
            preferred_destinations: selectedDestinations,
            urgency_preferences: selectedUrgency,
          }
        });
        
        toast.success("Your Pulse preferences have been saved!");
      } else {
        // For non-authenticated users, just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success("Preferences received! Sign in to save them to your profile.");
      }
      
      setIsComplete(true);
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById("pulse-results");
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("There was an error saving your preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="pulse-questionnaire" className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gray-900 border border-gray-800 shadow-xl shadow-amber-900/5 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-800">
            <CardTitle className="text-2xl text-center text-white">
              {isComplete ? "Thank you for your preferences!" : "Tell us about your travel style"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="rounded-full bg-green-500/20 p-3 mb-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Preferences Saved!</h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    We're tailoring your Pulse recommendations based on your preferences. 
                    Scroll down to view your personalized flight suggestions.
                  </p>
                </motion.div>
              ) : (
                <>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-medium text-white mb-4">Select your travel interests</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {travelInterests.map((interest) => (
                          <Badge
                            key={interest}
                            variant={selectedInterests.includes(interest) ? "default" : "outline"}
                            className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                              ${selectedInterests.includes(interest) 
                                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-medium text-white mb-4">How do you prefer to travel?</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {socialPreferences.map((pref) => (
                          <Badge
                            key={pref}
                            variant={selectedSocialPrefs.includes(pref) ? "default" : "outline"}
                            className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                              ${selectedSocialPrefs.includes(pref) 
                                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                            onClick={() => toggleSocialPref(pref)}
                          >
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-medium text-white mb-4">Select your preferred destinations</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {popularDestinations.map((destination) => (
                          <Badge
                            key={destination}
                            variant={selectedDestinations.includes(destination) ? "default" : "outline"}
                            className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                              ${selectedDestinations.includes(destination) 
                                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                            onClick={() => toggleDestination(destination)}
                          >
                            {destination}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-medium text-white mb-4">Your booking preferences</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        <Badge
                          variant={selectedUrgency.includes("Last-minute") ? "default" : "outline"}
                          className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                            ${selectedUrgency.includes("Last-minute") 
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                          onClick={() => toggleUrgency("Last-minute")}
                        >
                          Notify me of last-minute specials
                        </Badge>
                        <Badge
                          variant={selectedUrgency.includes("Advanced") ? "default" : "outline"}
                          className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                            ${selectedUrgency.includes("Advanced") 
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                          onClick={() => toggleUrgency("Advanced")}
                        >
                          Prefer advanced planning
                        </Badge>
                        <Badge
                          variant={selectedUrgency.includes("Exclusive") ? "default" : "outline"}
                          className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                            ${selectedUrgency.includes("Exclusive") 
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                          onClick={() => toggleUrgency("Exclusive")}
                        >
                          Show me exclusive limited-time offers only
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </CardContent>
          
          {!isComplete && (
            <CardFooter className="flex justify-between px-6 py-4 bg-gray-900 border-t border-gray-800">
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                disabled={step === 1 || isSubmitting}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Back
              </Button>
              
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s}
                    className={`w-2 h-2 rounded-full ${
                      s === step ? "bg-amber-500" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-white min-w-[80px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                      <span>Processing</span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </section>
  );
} 