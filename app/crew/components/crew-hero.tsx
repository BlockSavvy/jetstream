"use client";

import { Users, CheckCircle, Calendar, Shield, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback } from "react";

interface CrewHeroProps {
  activeTab: string;
}

export function CrewHero({ activeTab }: CrewHeroProps) {
  const handleTabChange = useCallback((value: string) => {
    // Dispatch a custom event when tab changes
    const event = new CustomEvent('crew-tab-change', { 
      detail: { tab: value } 
    });
    document.dispatchEvent(event);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-10 px-4 md:px-6 rounded-lg overflow-hidden mb-6">
      {/* Abstract background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 -right-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-400 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-500">
            <Users className="h-6 w-6" />
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
          JetStream Flight Professionals
        </h1>
        
        <p className="text-base text-gray-300 mb-6 max-w-3xl mx-auto">
          From elite captains with years of expertise to specialized crew members offering unique in-flight experiences. 
          Discover the professionals who will make your journey extraordinary.
        </p>
        
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={handleTabChange}
          className="mx-auto max-w-md"
        >
          <TabsList className="w-full grid grid-cols-2 p-1 bg-gray-800/60 backdrop-blur-sm">
            <TabsTrigger 
              value="crew" 
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Specialized Crew
            </TabsTrigger>
            <TabsTrigger 
              value="captain" 
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Elite Captains
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-3 py-1 border border-gray-700">
            <Star className="text-amber-400 h-3.5 w-3.5 mr-1.5" />
            <span className="text-gray-300 text-xs">Exceptional Ratings</span>
          </div>
          
          <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-3 py-1 border border-gray-700">
            <CheckCircle className="text-amber-400 h-3.5 w-3.5 mr-1.5" />
            <span className="text-gray-300 text-xs">Verified Professionals</span>
          </div>
          
          <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-3 py-1 border border-gray-700">
            <Calendar className="text-amber-400 h-3.5 w-3.5 mr-1.5" />
            <span className="text-gray-300 text-xs">Specialized Experiences</span>
          </div>
        </div>
      </div>
    </div>
  );
} 