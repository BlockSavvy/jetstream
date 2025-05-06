'use client';

import JetShareOfferForm from '../components/JetShareOfferForm';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import React from 'react';
import { Loader2 } from 'lucide-react';

// This page is already using Suspense correctly, but we need to make sure the component
// that uses searchParams is properly extracted

// Extract a component that uses searchParams to properly handle suspense
function JetShareOfferContent() {
  // Use proper typing for airports array
  interface Airport {
    code: string;
    name: string;
    city: string;
    country: string;
    is_private?: boolean;
    lat?: number;
    lng?: number;
  }
  
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams ? searchParams.get('edit') : null;
  
  // Fetch airports data when component mounts - IMPROVED with better error handling
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setIsLoadingAirports(true);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        console.log('==== GDYUP AIRPORT LOADING ====');
        console.log('Fetching airports data from database...');
        
        // Use a direct API call with no credentials
        const url = `/api/airports?t=${timestamp}`;
        console.log(`Airport API URL: ${url}`);
        
        // Explicit headers to ensure JSON response
        const headers = {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        };
        
        console.log('Starting API request with headers:', headers);
        const response = await fetch(url, {
          method: 'GET',
          headers,
          // No credentials - let the database service key handle it
          next: { revalidate: 0 } // Ensure no Next.js caching
        });
        
        console.log(`Airports API response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          console.error(`Airport API error: ${response.status} ${response.statusText}`);
          throw new Error(`API error: ${response.status}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`Response content type: ${contentType}`);
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Unexpected content type:', contentType);
          throw new Error('API did not return JSON');
        }
        
        const data = await response.json();
        console.log(`Airports data received: ${data.airports ? data.airports.length : 0} airports`);
        
        if (data && data.airports) {
          setAirports(data.airports);
        } else {
          console.error('No airports data in response:', data);
          throw new Error('No airports data received');
        }
      } catch (error) {
        console.error('Error fetching airports:', error);
        // Set a default list of airports for fallback
        setAirports([
          { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
          { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
          { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'USA' },
          { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
          { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
        ]);
      } finally {
        setIsLoadingAirports(false);
      }
    };
    
    fetchAirports();
  }, []);
  
  // Wait until airports are loaded before rendering the form
  if (isLoadingAirports) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <JetShareOfferForm 
      airportsList={airports}
      editOfferId={editId} 
    />
  );
}

export default function OfferPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <JetShareOfferContent />
    </Suspense>
  );
} 