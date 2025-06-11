'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JetShareOfferEditForm from '@/app/gdyup/components/JetShareOfferEditForm';
import { Suspense } from 'react';
import JetShareOfferForm from '../../../components/JetShareOfferForm';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { ClientLayoutWrapper } from '../../../client-layout-wrapper';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../../../hooks/useGdyupTheme';

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<JetShareOfferWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getThemedTextClasses } = useGdyupTheme();
  
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        setLoading(true);
        // Get the offer details
        const offerId = params?.id;
        if (!offerId) {
          throw new Error('No offer ID provided');
        }
        
        const response = await fetch(`/api/jetshare/getOffers?id=${offerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch offer');
        }
        
        const data = await response.json();
        
        if (!data.offers || data.offers.length === 0) {
          throw new Error('Offer not found');
        }
        
        setOffer(data.offers[0]);
      } catch (error) {
        console.error('Error fetching offer:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        router.push('/gdyup/dashboard?error=offer-not-found');
      } finally {
        setLoading(false);
      }
    };
    
    if (params?.id) {
      fetchOffer();
    }
  }, [params?.id, router]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DAFF0D]"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-lg">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <ClientLayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        <h1 className={cn("text-3xl font-bold mb-8", getThemedTextClasses())}>Edit Your JetShare Offer</h1>
        {offer && (
          <Suspense fallback={
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DAFF0D]"></div>
            </div>
          }>
            <JetShareOfferEditForm offer={offer} userId={offer.user_id} />
          </Suspense>
        )}
      </div>
    </ClientLayoutWrapper>
  );
} 