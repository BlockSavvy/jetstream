'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGdyupTheme } from './hooks/useGdyupTheme';

export default function NotFound() {
  const { getThemeClasses } = useGdyupTheme();
  const [offerId, setOfferId] = useState<string | null>(null);
  
  // On component mount, check if we can recover the offer ID from localStorage
  useEffect(() => {
    try {
      const savedOfferId = localStorage.getItem('current_payment_offer_id') || 
                          localStorage.getItem('last_accepted_offer_id');
                          
      if (savedOfferId) {
        console.log('Found saved offer ID for recovery:', savedOfferId);
        setOfferId(savedOfferId);
      }
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
    }
  }, []);
  
  // Return a tailored error page based on where the user likely came from
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4">404 Not Found</h2>
        <p className="mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/gdyup/error-fix"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Error Fix Page
        </Link>
      </div>
    </div>
  );
} 