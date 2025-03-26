"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Users, Shield } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { CrewSpecialization, CaptainSpecialization } from "@/lib/types/crew.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define the question types
type TravelInterest = "Business" | "Sports" | "Tech" | "Art" | "Luxury" | "Music" | "Fashion" | "Crypto" | "Wellness" | "Family" | "Adventure";
type SocialPreference = "Networking" | "Privacy" | "Family-friendly" | "Social" | "Professional";
type UrgencyPreference = "Last-minute" | "Advanced" | "Exclusive";
type ProfessionalPreference = "Captain" | "Crew" | "Both";

const travelInterests: TravelInterest[] = ["Business", "Sports", "Tech", "Art", "Luxury", "Music", "Fashion", "Crypto", "Wellness", "Family", "Adventure"];
const socialPreferences: SocialPreference[] = ["Networking", "Privacy", "Family-friendly", "Social", "Professional"];
const popularDestinations = ["Cannes", "Miami", "Dubai", "New York", "London", "Monaco", "Tokyo", "Singapore", "Paris", "Las Vegas"];
const urgencyPreferences: UrgencyPreference[] = ["Last-minute", "Advanced", "Exclusive"];

// Crew specializations for the questionnaire
const crewSpecializations: CrewSpecialization[] = [
  'Comedy',
  'TED-talks',
  'Live Podcasts',
  'Wellness Sessions',
  'Business Networking',
  'Family-friendly Activities',
  'Musical Performances',
  'Interactive Mystery Events'
];

// Captain specializations for the questionnaire
const captainSpecializations: CaptainSpecialization[] = [
  'Luxury',
  'Business',
  'Family-oriented',
  'Entertainment-focused',
  'Adventure',
  'VIP Service',
  'International Flights'
];

export default function PulseQuestionnaire() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<TravelInterest[]>([]);
  const [selectedSocialPrefs, setSelectedSocialPrefs] = useState<SocialPreference[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyPreference[]>([]);
  const [selectedCrewSpecializations, setSelectedCrewSpecializations] = useState<CrewSpecialization[]>([]);
  const [selectedCaptainSpecializations, setSelectedCaptainSpecializations] = useState<CaptainSpecialization[]>([]);
  const [professionalPreference, setProfessionalPreference] = useState<ProfessionalPreference>("Both");
  const [preferDedicatedCaptain, setPreferDedicatedCaptain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (profile?.travel_preferences) {
      const prefs = profile.travel_preferences;
      if (prefs.travel_interests) setSelectedInterests(prefs.travel_interests as TravelInterest[]);
      if (prefs.social_preferences) setSelectedSocialPrefs(prefs.social_preferences as SocialPreference[]);
      if (prefs.preferred_destinations) setSelectedDestinations(prefs.preferred_destinations);
      if (prefs.urgency_preferences) setSelectedUrgency(prefs.urgency_preferences as UrgencyPreference[]);
      if (prefs.crew_specializations) setSelectedCrewSpecializations(prefs.crew_specializations as CrewSpecialization[]);
      if (prefs.captain_specializations) setSelectedCaptainSpecializations(prefs.captain_specializations as CaptainSpecialization[]);
      if (prefs.professional_preference) setProfessionalPreference(prefs.professional_preference as ProfessionalPreference);
      if (prefs.prefer_dedicated_captain !== undefined) setPreferDedicatedCaptain(prefs.prefer_dedicated_captain);
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
  
  const toggleCrewSpecialization = (specialization: CrewSpecialization) => {
    if (selectedCrewSpecializations.includes(specialization)) {
      setSelectedCrewSpecializations(selectedCrewSpecializations.filter(s => s !== specialization));
    } else {
      setSelectedCrewSpecializations([...selectedCrewSpecializations, specialization]);
    }
  };
  
  const toggleCaptainSpecialization = (specialization: CaptainSpecialization) => {
    if (selectedCaptainSpecializations.includes(specialization)) {
      setSelectedCaptainSpecializations(selectedCaptainSpecializations.filter(s => s !== specialization));
    } else {
      setSelectedCaptainSpecializations([...selectedCaptainSpecializations, specialization]);
    }
  };

  const handleProfessionalPrefChange = (value: string) => {
    setProfessionalPreference(value as ProfessionalPreference);
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
            crew_specializations: selectedCrewSpecializations,
            captain_specializations: selectedCaptainSpecializations,
            professional_preference: professionalPreference,
            prefer_dedicated_captain: preferDedicatedCaptain
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

  const getTotalSteps = () => 6; // Now with 6 steps including flight professionals
  
  const nextStep = () => {
    if (step < getTotalSteps()) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
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
              ) :
                <>
                  {/* Progress indicator */}
                  <div className="flex justify-between mb-6">
                    {Array.from({ length: getTotalSteps() }, (_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 rounded-full flex-1 mx-0.5 ${
                          i < step ? "bg-amber-500" : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  
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
                      <h3 className="text-lg font-medium text-white mb-4">What is your social preference?</h3>
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
                      <h3 className="text-lg font-medium text-white mb-4">Preferred destinations</h3>
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
                      <h3 className="text-lg font-medium text-white mb-4">How far ahead do you plan?</h3>
                      <div className="flex flex-col gap-3 mb-6">
                        <Badge
                          variant={selectedUrgency.includes("Last-minute") ? "default" : "outline"}
                          className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                            ${selectedUrgency.includes("Last-minute") 
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                          onClick={() => toggleUrgency("Last-minute")}
                        >
                          I prefer last-minute deals and spontaneous travel
                        </Badge>
                        
                        <Badge
                          variant={selectedUrgency.includes("Advanced") ? "default" : "outline"}
                          className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                            ${selectedUrgency.includes("Advanced") 
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                          onClick={() => toggleUrgency("Advanced")}
                        >
                          I like to plan trips well in advance
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
                  
                  {step === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-medium text-white mb-4">Flight Professional Preferences</h3>
                      
                      <div className="mb-6">
                        <Label className="text-white mb-2 block">Who matters most for your journey?</Label>
                        <Tabs 
                          value={professionalPreference} 
                          onValueChange={handleProfessionalPrefChange} 
                          className="w-full mb-6"
                        >
                          <TabsList className="w-full grid grid-cols-3 bg-gray-800">
                            <TabsTrigger value="Crew" className="data-[state=active]:bg-amber-500">
                              <Users className="h-4 w-4 mr-2" />
                              Crew
                            </TabsTrigger>
                            <TabsTrigger value="Captain" className="data-[state=active]:bg-amber-500">
                              <Shield className="h-4 w-4 mr-2" />
                              Captain
                            </TabsTrigger>
                            <TabsTrigger value="Both" className="data-[state=active]:bg-amber-500">
                              Both
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        
                        {(professionalPreference === "Captain" || professionalPreference === "Both") && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-4">
                              <Label htmlFor="dedicated-toggle" className="text-gray-300">
                                I prefer dedicated captains assigned to specific jets
                              </Label>
                              <Switch
                                id="dedicated-toggle"
                                checked={preferDedicatedCaptain}
                                onCheckedChange={setPreferDedicatedCaptain}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  {step === 6 && (
                    <motion.div
                      key="step6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-medium text-white mb-4">Flight Experience Preferences</h3>
                      
                      <Tabs defaultValue={professionalPreference === "Captain" ? "captain" : "crew"} className="w-full mb-6">
                        <TabsList className="w-full grid grid-cols-2 bg-gray-800">
                          <TabsTrigger 
                            value="crew" 
                            disabled={professionalPreference === "Captain"}
                            className="data-[state=active]:bg-amber-500"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Crew Specializations
                          </TabsTrigger>
                          <TabsTrigger 
                            value="captain" 
                            disabled={professionalPreference === "Crew"}
                            className="data-[state=active]:bg-amber-500"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Captain Specializations
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="crew" className="mt-4">
                          <p className="text-gray-400 mb-4">
                            Select the types of in-flight experiences you're interested in:
                          </p>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {crewSpecializations.map((spec) => (
                              <Badge
                                key={spec}
                                variant={selectedCrewSpecializations.includes(spec) ? "default" : "outline"}
                                className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                                  ${selectedCrewSpecializations.includes(spec) 
                                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                                onClick={() => toggleCrewSpecialization(spec)}
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="captain" className="mt-4">
                          <p className="text-gray-400 mb-4">
                            Select captain specializations that matter to you:
                          </p>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {captainSpecializations.map((spec) => (
                              <Badge
                                key={spec}
                                variant={selectedCaptainSpecializations.includes(spec) ? "default" : "outline"}
                                className={`text-sm py-1.5 px-3 rounded-full cursor-pointer transition-all
                                  ${selectedCaptainSpecializations.includes(spec) 
                                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"}`}
                                onClick={() => toggleCaptainSpecialization(spec)}
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </motion.div>
                  )}
                </>
              }
            </AnimatePresence>
          </CardContent>
          
          {!isComplete && (
            <CardFooter className="px-6 py-4 bg-gray-900 border-t border-gray-800 flex justify-between">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1 || isSubmitting}
                className="text-gray-400 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : step === getTotalSteps() ? (
                  "Save Preferences"
                ) : (
                  "Next"
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </section>
  );
} 