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
  
  // Fetch airports data when component mounts - IMPROVED with better error handling and retries
  useEffect(() => {
    const fetchAirports = async (retryCount = 0) => {
      try {
        setIsLoadingAirports(true);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        console.log(`Fetching airports data (attempt ${retryCount + 1})...`);
        
        // Use the fully qualified URL in production to avoid routing issues
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const url = baseUrl 
          ? `${baseUrl}/api/airports?t=${timestamp}` 
          : `/api/airports?t=${timestamp}`;
          
        console.log(`Airport API URL: ${url}`);
        
        // Include credentials and explicit headers to ensure proper authentication
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        };
        
        // Log that we're making the fetch request
        console.log('Sending fetch request to airports API...');
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include', // Important: include credentials for cross-domain requests
          next: { revalidate: 0 } // Ensure no Next.js caching
        });
        
        // Log the response status
        console.log(`Airports API response status: ${response.status}`);
        
        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`Unexpected content type from airports API: ${contentType}. Expected JSON.`);
          
          // For production resilience, load the embedded fallback data directly
          if (retryCount >= 1 || process.env.NODE_ENV === 'production') {
            console.log('Loading embedded fallback airport data after content type error');
            const fallbackData = getFallbackAirportData();
            setAirports(fallbackData);
            setIsLoadingAirports(false);
            
            // Store in sessionStorage for future use
            try {
              sessionStorage.setItem('jetstream_airports', JSON.stringify(fallbackData));
              console.log('Cached fallback airports in sessionStorage');
            } catch (e) {
              console.warn('Failed to cache airports in sessionStorage:', e);
            }
            
            return true;
          }
          
          // Retry once if this is the first attempt
          if (retryCount === 0) {
            console.log('Unexpected content type, retrying airport data fetch...');
            setTimeout(() => fetchAirports(1), 1500); // Wait 1.5 seconds before retry
            return false;
          }
          
          // Fallback to cached data if retry fails
          return loadCachedAirports();
        }
        
        if (response.ok) {
          // Attempt to parse the response as text first to debug any JSON parse issues
          const rawText = await response.text();
          console.log(`Raw API response length: ${rawText.length} characters`);
          
          let data;
          try {
            // Try to parse the text as JSON
            data = JSON.parse(rawText);
            console.log(`Successfully parsed airports data: ${data.length} airports found`);
          } catch (jsonError) {
            console.error('Failed to parse airports API response as JSON:', jsonError);
            console.log('First 100 characters of response:', rawText.substring(0, 100));
            
            // For production resilience, load the embedded fallback data directly
            if (retryCount >= 1 || process.env.NODE_ENV === 'production') {
              console.log('Loading embedded fallback airport data after JSON parse error');
              const fallbackData = getFallbackAirportData();
              setAirports(fallbackData);
              setIsLoadingAirports(false);
              
              // Store in sessionStorage for future use
              try {
                sessionStorage.setItem('jetstream_airports', JSON.stringify(fallbackData));
                console.log('Cached fallback airports in sessionStorage');
              } catch (e) {
                console.warn('Failed to cache airports in sessionStorage:', e);
              }
              
              return true;
            }
            
            // Retry once if this is the first attempt
            if (retryCount === 0) {
              console.log('JSON parse error, retrying airport data fetch...');
              setTimeout(() => fetchAirports(1), 1500); // Wait 1.5 seconds before retry
              return false;
            }
            
            // Fallback to cached data
            return loadCachedAirports();
          }
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Successfully loaded ${data.length} airports from API`);
            
            // Sort airports by city name for better UX
            const sortedData = [...data].sort((a, b) => a.city.localeCompare(b.city));
            setAirports(sortedData);
            
            // Store in sessionStorage for quick access on future loads
            try {
              sessionStorage.setItem('jetstream_airports', JSON.stringify(sortedData));
              console.log('Cached airports in sessionStorage for future use');
            } catch (e) {
              console.warn('Failed to cache airports in sessionStorage:', e);
            }
            
            // Success! Return early
            return true;
          } else {
            console.error('API returned empty or invalid airports data', data);
            
            // For production resilience, load the embedded fallback data directly
            if (retryCount >= 1 || process.env.NODE_ENV === 'production') {
              console.log('Loading embedded fallback airport data after empty API response');
              const fallbackData = getFallbackAirportData();
              setAirports(fallbackData);
              setIsLoadingAirports(false);
              return true;
            }
            
            // Retry once if this is the first attempt
            if (retryCount === 0) {
              console.log('Retrying airport data fetch...');
              setTimeout(() => fetchAirports(1), 1000); // Wait 1 second before retry
              return false;
            }
            
            // Fallback to cached data after retry
            return loadCachedAirports();
          }
        } else {
          let errorDetails = '';
          try {
            // Try to parse error response as JSON
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData);
          } catch {
            // If not JSON, get as text
            errorDetails = await response.text();
          }
          
          console.error(`Failed to fetch airports: ${response.status} ${errorDetails}`);
          
          // For production resilience, load the embedded fallback data directly
          if (retryCount >= 1 || process.env.NODE_ENV === 'production') {
            console.log('Loading embedded fallback airport data after fetch error');
            const fallbackData = getFallbackAirportData();
            setAirports(fallbackData);
            setIsLoadingAirports(false);
            return true;
          }
          
          // Retry once on server errors (5xx) if this is the first attempt
          if (response.status >= 500 && retryCount === 0) {
            console.log('Server error, retrying airport data fetch...');
            setTimeout(() => fetchAirports(1), 1500); // Wait 1.5 seconds before retry
            return false;
          }
          
          // Fallback to cached data after retry
          return loadCachedAirports();
        }
      } catch (error) {
        console.error('Error fetching airports:', error);
        
        // For production resilience, load the embedded fallback data directly
        if (retryCount >= 1 || process.env.NODE_ENV === 'production') {
          console.log('Loading embedded fallback airport data after fetch exception');
          const fallbackData = getFallbackAirportData();
          setAirports(fallbackData);
          setIsLoadingAirports(false);
          return true;
        }
        
        // Retry once if this is the first attempt
        if (retryCount === 0) {
          console.log('Network error, retrying airport data fetch...');
          setTimeout(() => fetchAirports(1), 1000); // Wait 1 second before retry
          return false;
        }
        
        // Fallback to cached data after retry
        return loadCachedAirports();
      } finally {
        // Only set loading to false if we're done with all retries
        if (retryCount > 0) {
          setIsLoadingAirports(false);
        }
      }
    };
    
    // Helper function to load cached airports from sessionStorage
    const loadCachedAirports = () => {
      try {
        const cachedAirports = sessionStorage.getItem('jetstream_airports');
        if (cachedAirports) {
          const parsed = JSON.parse(cachedAirports);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Using ${parsed.length} cached airports from sessionStorage`);
            setAirports(parsed);
            setIsLoadingAirports(false);
            return true;
          }
        }
        
        // If no cached data, fall back to embedded data
        console.log('No cached airports available, using embedded fallback data');
        const fallbackData = getFallbackAirportData();
        setAirports(fallbackData);
        setIsLoadingAirports(false);
        return true;
      } catch (e) {
        console.warn('Error reading cached airports from sessionStorage:', e);
        
        // If session storage fails, use embedded fallback data
        console.log('Using embedded fallback airport data after sessionStorage error');
        const fallbackData = getFallbackAirportData();
        setAirports(fallbackData);
        setIsLoadingAirports(false);
        return true;
      }
    };
    
    // Helper function that provides embedded fallback airport data
    const getFallbackAirportData = () => {
      // Ensure this data matches the Airport interface
      return [
        { code: "KJFK", name: "John F. Kennedy International Airport", city: "New York, NY", country: "USA", is_private: false, image_url: "/images/airports/kjfk.png", lat: 40.6413, lng: -73.7781 },
        { code: "KFLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale, FL", country: "USA", is_private: false, image_url: "/images/airports/kfll.png", lat: 26.0742, lng: -80.1506 },
        { code: "KLAX", name: "Los Angeles International Airport", city: "Los Angeles, CA", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 33.9416, lng: -118.4085 },
        { code: "KLAS", name: "Harry Reid International Airport", city: "Las Vegas, NV", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 36.0840, lng: -115.1537 },
        { code: "KMIA", name: "Miami International Airport", city: "Miami, FL", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 25.7932, lng: -80.2906 },
        { code: "KSFO", name: "San Francisco International Airport", city: "San Francisco, CA", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 37.6213, lng: -122.3790 },
        { code: "KSDL", name: "Scottsdale Airport", city: "Scottsdale, AZ", country: "USA", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 33.6229, lng: -111.9107 },
        { code: "KTEB", name: "Teterboro Airport", city: "Teterboro, NJ", country: "USA", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 40.8499, lng: -74.0610 },
        { code: "EGLL", name: "London Heathrow Airport", city: "London", country: "UK", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 51.4700, lng: -0.4543 },
        { code: "LFPB", name: "Paris–Le Bourget Airport", city: "Paris", country: "France", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 48.9698, lng: 2.4383 },
        { code: "EDDM", name: "Munich Airport", city: "Munich", country: "Germany", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 48.3538, lng: 11.7861 },
        { code: "KPBI", name: "Palm Beach International Airport", city: "West Palm Beach, FL", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 26.6832, lng: -80.0956 },
        { code: "KHPN", name: "Westchester County Airport", city: "White Plains, NY", country: "USA", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 41.0670, lng: -73.7076 },
        { code: "KDEN", name: "Denver International Airport", city: "Denver, CO", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 39.8560, lng: -104.6737 },
        { code: "KAPA", name: "Centennial Airport", city: "Denver, CO", country: "USA", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 39.5697, lng: -104.8493 },
        { code: "KDAL", name: "Dallas Love Field", city: "Dallas, TX", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 32.8471, lng: -96.8518 },
        { code: "KHOU", name: "William P. Hobby Airport", city: "Houston, TX", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 29.6454, lng: -95.2789 },
        { code: "KFXE", name: "Fort Lauderdale Executive Airport", city: "Fort Lauderdale, FL", country: "USA", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 26.1972, lng: -80.1707 },
        { code: "KOPF", name: "Opa Locka Executive Airport", city: "Miami, FL", country: "USA", is_private: true, image_url: "/images/airports/placeholder_airport_map.png", lat: 25.9135, lng: -80.2763 },
        { code: "KAUS", name: "Austin-Bergstrom International Airport", city: "Austin, TX", country: "USA", is_private: false, image_url: "/images/airports/placeholder_airport_map.png", lat: 30.1975, lng: -97.6664 }
      ].sort((a, b) => a.city.localeCompare(b.city));
    };
    
    // Try to use cached airports first for immediate rendering
    if (!loadCachedAirports()) {
      // If no cached airports, fetch fresh data
      fetchAirports();
    } else {
      // Even if we loaded cached airports, fetch fresh data in the background
      fetchAirports();
    }
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