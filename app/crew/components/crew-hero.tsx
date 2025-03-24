"use client";

import { Users, CheckCircle, Calendar } from "lucide-react";

export function CrewHero() {
  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 md:px-8 rounded-lg overflow-hidden mb-12">
      {/* Abstract background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 -right-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-400 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-500">
            <Users className="h-8 w-8" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          JetStream Specialized Crews
        </h1>
        
        <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
          Elevate your journey with our exclusive pilots and crews offering unique in-flight experiences. 
          From comedy shows to TED-style talks, podcast recordings to wellness sessions – transform 
          your travel time into an unforgettable event.
        </p>
        
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
            <span className="text-amber-400 mr-2">★</span>
            <span className="text-gray-300 text-sm">Exceptional Ratings</span>
          </div>
          
          <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
            <CheckCircle className="text-amber-400 h-4 w-4 mr-2" />
            <span className="text-gray-300 text-sm">Verified Professionals</span>
          </div>
          
          <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
            <Calendar className="text-amber-400 h-4 w-4 mr-2" />
            <span className="text-gray-300 text-sm">Specialized Events</span>
          </div>
        </div>
      </div>
    </div>
  );
} 