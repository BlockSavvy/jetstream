'use client';

import React from 'react';
import { ClientContentWrapper } from '../components/ClientContentWrapper';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BrowsePage() {
  const { getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();

  return (
    <ClientContentWrapper showHeader={true}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-5 md:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gdyup-primary">
              Browse Available Flights
            </h1>
            <p className={cn("text-xl", getThemedTextClasses())}>
              Find private jet seats at a fraction of the cost
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className={cn(
            "p-4 rounded-xl mb-6 shadow-lg",
            getThemedBackgroundClasses('card')
          )}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gdyup-text-medium" />
                <input 
                  type="text" 
                  placeholder="Search by route (e.g., NYC to LAX)"
                  className="w-full pl-10 pr-4 py-2 bg-gdyup-bg-dark border border-gdyup-border rounded-lg text-gdyup-text"
                />
              </div>
              <Button className={cn(getThemedButtonClasses('outline'), "px-6")}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Flight Listings Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample flight listings */}
            {[
              { 
                from: 'NYC', 
                to: 'MIA', 
                date: 'Aug 12', 
                price: '$2,850', 
                jet: 'Citation X',
                availability: '3 seats',
                departure: '2:30 PM'
              },
              { 
                from: 'LAX', 
                to: 'LAS', 
                date: 'Aug 14', 
                price: '$1,250', 
                jet: 'Phenom 300',
                availability: '2 seats',
                departure: '10:15 AM'
              },
              { 
                from: 'SFO', 
                to: 'SEA', 
                date: 'Aug 20', 
                price: '$1,950', 
                jet: 'G450',
                availability: '4 seats',
                departure: '4:45 PM'
              }
            ].map((listing, index) => (
              <div
                key={index}
                className={cn(
                  "p-6 rounded-xl shadow-lg border border-gdyup-border hover:border-gdyup-primary transition-all duration-300 cursor-pointer",
                  getThemedBackgroundClasses('card')
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gdyup-text mb-1">{listing.from} → {listing.to}</h3>
                    <p className="text-sm text-gdyup-text-medium">{listing.date} · {listing.departure}</p>
                    <p className="text-sm text-gdyup-text-medium">{listing.jet}</p>
                  </div>
                  <div className="bg-gdyup-primary/20 rounded-full px-3 py-1 text-xs font-medium text-gdyup-primary border border-gdyup-primary/30">
                    {listing.availability}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gdyup-text-medium">Starting at</p>
                    <p className="text-2xl font-bold text-gdyup-primary">{listing.price}</p>
                  </div>
                  <Button className={cn(
                    getThemedButtonClasses('primary'),
                    "rounded-full"
                  )}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-8">
            <Button variant="outline" className="px-8 py-3">
              Load More Flights
            </Button>
          </div>
        </div>
      </div>
    </ClientContentWrapper>
  );
} 