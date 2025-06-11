'use client';

import { useState } from 'react';
import AirportMap from '../components/AirportMap';
import { Button } from '@/components/ui/button';

export default function AirportMapExample() {
  const [departure, setDeparture] = useState('New York (KJFK)');
  const [arrival, setArrival] = useState('Los Angeles (KLAX)');

  return (
    <div className="p-4 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#DAFF0D]">Airport Map Component Examples</h1>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Route Visualization</h2>
        <p className="text-gray-300">This example shows a route map between two airports.</p>
        
        <div className="flex gap-4 mb-4">
          <input 
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            placeholder="Departure location"
            className="p-2 bg-gray-800 border border-gray-700 rounded-md"
          />
          <input 
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            placeholder="Arrival location"
            className="p-2 bg-gray-800 border border-gray-700 rounded-md"
          />
        </div>
        
        <div className="h-56 w-full bg-gray-800 rounded-xl overflow-hidden">
          <AirportMap 
            departure={departure} 
            arrival={arrival} 
            showRoute={true}
            className="w-full h-full"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Single Airport</h2>
          <p className="text-gray-300">This example shows a single airport map.</p>
          
          <div className="h-40 w-full bg-gray-800 rounded-xl overflow-hidden">
            <AirportMap 
              departure={departure} 
              showRoute={false}
              className="w-full h-full"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Different Size</h2>
          <p className="text-gray-300">Maps can be sized differently.</p>
          
          <div className="h-40 w-full bg-gray-800 rounded-xl overflow-hidden">
            <AirportMap 
              arrival={arrival} 
              showRoute={false}
              className="w-full h-full"
              imageClassName="object-cover object-top"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Code Example for JetShareOfferForm</h2>
        <p className="text-gray-300">This is how to integrate the component in your form:</p>
        
        <pre className="p-4 bg-gray-900 rounded-lg overflow-auto text-sm text-gray-300">
{`// In JetShareOfferForm.tsx:

{/* Route Visualization - Using AirportMap */}
{form.watch('departure_location') && form.watch('arrival_location') && (
  <div className="relative h-28 my-6 overflow-hidden bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-inner z-10">
    <AirportMap
      departure={form.watch('departure_location')}
      arrival={form.watch('arrival_location')}
      showRoute={true}
      className="w-full h-full"
    />
  </div>
)}

// Also used in summary section:

{/* Enhanced Summary with visual representation */}
<div className="mt-6 overflow-hidden rounded-xl bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 shadow-xl">
  {/* Add the airport map above the summary */}
  {form.watch('departure_location') && form.watch('arrival_location') && (
    <div className="w-full h-48 relative">
      <AirportMap
        departure={form.watch('departure_location')}
        arrival={form.watch('arrival_location')}
        showRoute={true}
        className="w-full h-full"
      />
    </div>
  )}
  <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-3">
    <h3 className="font-bold text-base">Flight Share Offer Summary</h3>
  </div>
  {/* Rest of summary content */}
</div>`}
        </pre>
      </div>
      
      <div className="space-y-2 bg-gray-800 p-4 rounded-xl">
        <h2 className="text-xl font-semibold text-white">SQL to update your database</h2>
        <p className="text-gray-300">Run this SQL to add the image_url column to your airports table:</p>
        
        <pre className="p-4 bg-gray-900 rounded-lg overflow-auto text-sm text-gray-300">
{`-- Add image_url column to airports table
ALTER TABLE "public"."airports" 
ADD COLUMN "image_url" TEXT DEFAULT '/images/airports/placeholder_airport_map.png';

-- Update existing airports with the placeholder image
UPDATE "public"."airports"
SET "image_url" = '/images/airports/placeholder_airport_map.png';

-- Add route_map_template column for future route map generation
ALTER TABLE "public"."airports" 
ADD COLUMN "route_map_template" TEXT DEFAULT NULL;`}
        </pre>
      </div>
    </div>
  );
}
