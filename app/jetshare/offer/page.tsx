'use client';

// Force dynamic rendering to prevent client-side code execution during static generation
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import JetShareOfferForm from '../components/JetShareOfferForm';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function JetShareOfferPage() {
  const [airports, setAirports] = useState([]);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [pageTitle, setPageTitle] = useState('Create a JetShare Offer');
  
  // Update title if editing an offer
  useEffect(() => {
    if (editId) {
      setPageTitle('Edit Your JetShare Offer');
    }
  }, [editId]);
  
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">{pageTitle}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
        {editId 
          ? 'Update your JetShare offer details below.' 
          : 'Share your private jet flight and offset your costs by offering a portion to other verified travelers.'
        }
      </p>
      
      <div className="max-w-2xl mx-auto">
        <JetShareOfferForm airportsList={airports} editOfferId={editId} />
      </div>
    </div>
  );
} 