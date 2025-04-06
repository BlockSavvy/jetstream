'use client';

import JetShareOfferForm from '../components/JetShareOfferForm';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Extract a component that uses searchParams to properly handle suspense
function JetShareOfferContent() {
  const [airports, setAirports] = useState([]);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  // Fetch airports data when component mounts
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch('/api/airports');
        if (response.ok) {
          const data = await response.json();
          setAirports(data);
          
          // Store in sessionStorage for quick access
          try {
            sessionStorage.setItem('jetstream_airports', JSON.stringify(data));
          } catch (e) {
            console.warn('Failed to cache airports in sessionStorage', e);
          }
          
          console.log(`Loaded ${data.length} airports for location selector`);
        } else {
          console.error('Failed to fetch airports');
        }
      } catch (error) {
        console.error('Error fetching airports:', error);
      }
    };
    
    // Check if we already have airports in sessionStorage
    try {
      const cachedAirports = sessionStorage.getItem('jetstream_airports');
      if (cachedAirports) {
        setAirports(JSON.parse(cachedAirports));
        console.log('Using cached airports from sessionStorage');
      } else {
        fetchAirports();
      }
    } catch (e) {
      fetchAirports();
    }
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-2">
      <div className="max-w-2xl mx-auto">
        <JetShareOfferForm airportsList={airports} editOfferId={editId} />
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