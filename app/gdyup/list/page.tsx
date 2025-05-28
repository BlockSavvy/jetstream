'use client';

import React from 'react';
import { ClientContentWrapper } from '../components/ClientContentWrapper';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { Plane, Share, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ListPage() {
  const { getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();

  return (
    <ClientContentWrapper showHeader={true}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-5 md:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gdyup-primary">
              List Your Private Flight
            </h1>
            <p className={cn("text-xl", getThemedTextClasses())}>
              Share empty seats and recover up to 70% of your flight costs
            </p>
          </div>

          {/* Quick Start Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className={cn(
              "p-6 rounded-xl shadow-lg border border-gdyup-border",
              getThemedBackgroundClasses('card')
            )}>
              <div className="flex items-center mb-4">
                <div className="bg-gdyup-primary/20 rounded-full p-3 mr-4">
                  <Plane className="w-6 h-6 text-gdyup-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gdyup-text">Already Booked?</h3>
                  <p className="text-sm text-gdyup-text-medium">Share your existing private flight</p>
                </div>
              </div>
              <Button className={cn(
                getThemedButtonClasses('primary'),
                "w-full"
              )}>
                List Existing Flight
              </Button>
            </div>

            <div className={cn(
              "p-6 rounded-xl shadow-lg border border-gdyup-border",
              getThemedBackgroundClasses('card')
            )}>
              <div className="flex items-center mb-4">
                <div className="bg-gdyup-primary/20 rounded-full p-3 mr-4">
                  <Share className="w-6 h-6 text-gdyup-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gdyup-text">Planning a Trip?</h3>
                  <p className="text-sm text-gdyup-text-medium">Create a new shared flight</p>
                </div>
              </div>
              <Button className={cn(
                getThemedButtonClasses('outline'),
                "w-full"
              )}>
                Plan New Flight
              </Button>
            </div>
          </div>

          {/* Quick Flight Form */}
          <div className={cn(
            "p-6 rounded-xl shadow-lg",
            getThemedBackgroundClasses('card')
          )}>
            <h2 className="text-2xl font-bold text-gdyup-text mb-6">Quick Flight Details</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Route Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gdyup-text mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Departure City
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., New York (JFK)"
                    className="w-full px-4 py-2 bg-gdyup-bg-dark border border-gdyup-border rounded-lg text-gdyup-text"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gdyup-text mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Destination City
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Miami (MIA)"
                    className="w-full px-4 py-2 bg-gdyup-bg-dark border border-gdyup-border rounded-lg text-gdyup-text"
                  />
                </div>
              </div>

              {/* Flight Details Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gdyup-text mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Departure Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-2 bg-gdyup-bg-dark border border-gdyup-border rounded-lg text-gdyup-text"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gdyup-text mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Available Seats
                  </label>
                  <select className="w-full px-4 py-2 bg-gdyup-bg-dark border border-gdyup-border rounded-lg text-gdyup-text">
                    <option>1 seat</option>
                    <option>2 seats</option>
                    <option>3 seats</option>
                    <option>4+ seats</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button className={cn(
                getThemedButtonClasses('primary'),
                "flex-1"
              )}>
                Continue to Details
              </Button>
              <Button variant="outline" className="flex-1">
                Save as Draft
              </Button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className={cn(
            "mt-8 p-6 rounded-xl",
            getThemedBackgroundClasses('card')
          )}>
            <h3 className="text-xl font-bold text-gdyup-text mb-4">Why List with GDY·UP?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gdyup-primary mb-2">70%</div>
                <p className="text-sm text-gdyup-text-medium">Average cost recovery</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gdyup-primary mb-2">7.5%</div>
                <p className="text-sm text-gdyup-text-medium">Platform fee</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gdyup-primary mb-2">24/7</div>
                <p className="text-sm text-gdyup-text-medium">AI concierge support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientContentWrapper>
  );
} 