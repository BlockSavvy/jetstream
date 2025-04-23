'use client';

import JetShareOfferForm from '../components/JetShareOfferForm';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { redirect } from 'next/navigation';

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
  const editId = searchParams ? searchParams.get('edit') : null;
  
  // Fetch airports data when component mounts - IMPROVED with better error handling
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setIsLoadingAirports(true);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
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
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          // No credentials - let the database service key handle it
          next: { revalidate: 0 } // Ensure no Next.js caching
        });
        
        console.log(`Airports API response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`API returned non-JSON content: ${contentType}`);
        }
        
        // Parse response directly as JSON
        const airports = await response.json();
        
        if (!Array.isArray(airports)) {
          throw new Error('API did not return an array of airports');
        }
        
        console.log(`Successfully loaded ${airports.length} airports from database`);
        
        // Sort airports by city name for better UX
        const sortedAirports = [...airports].sort((a, b) => a.city.localeCompare(b.city));
        setAirports(sortedAirports);
        
        // Store in sessionStorage for quick access on future loads
        try {
          sessionStorage.setItem('jetstream_airports', JSON.stringify(sortedAirports));
          console.log('Cached airports in sessionStorage for future use');
        } catch (e) {
          console.warn('Failed to cache airports in sessionStorage:', e);
        }
      } catch (error) {
        console.error('Error fetching airports from database:', error);
        
        // Check if we have cached data to use temporarily
        try {
          const cachedAirports = sessionStorage.getItem('jetstream_airports');
          if (cachedAirports) {
            const parsed = JSON.parse(cachedAirports);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`Using ${parsed.length} cached airports while database connection is fixed`);
              setAirports(parsed);
            } else {
              // If no valid cache, just show empty array - no fallbacks
              setAirports([]);
            }
          } else {
            // If no cache, just show empty array - no fallbacks
            setAirports([]);
          }
        } catch (e) {
          console.error('Session storage error:', e);
          // No fallbacks - just show empty array
          setAirports([]);
        }
      } finally {
        setIsLoadingAirports(false);
      }
    };
    
    // Fetch airports on component mount
    fetchAirports();
  }, []);
  
  // Display data fetching status in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`JetShareOfferContent: Airport data status: ${isLoadingAirports ? 'Loading...' : airports.length > 0 ? `Loaded ${airports.length} airports` : 'No data available'}`);
    }
  }, [isLoadingAirports, airports]);

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="max-w-2xl mx-auto">
        {/* Initial loading indicator for airports data */}
        {isLoadingAirports && airports.length === 0 && (
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 mb-4 flex items-center space-x-3">
            <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-300">Loading airports data...</p>
          </div>
        )}
        
        {/* Show debug info in development */}
        {process.env.NODE_ENV === 'development' && !isLoadingAirports && (
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-2 mb-4 text-xs text-gray-400">
            <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded-md border border-blue-700/30 mr-2">DEV</span>
            {airports.length > 0 ? (
              <span>Using {airports.length} real airports from database</span>
            ) : (
              <span className="text-amber-400">No airport data available from database - using fallbacks</span>
            )}
          </div>
        )}
        
        <JetShareOfferForm 
          airportsList={airports} 
          editOfferId={editId} 
        />
      </div>
    </div>
  );
}

// Main page component with suspense boundary
export default function JetShareOfferPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-2 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    }>
      <JetShareOfferContent />
    </Suspense>
  );
} 