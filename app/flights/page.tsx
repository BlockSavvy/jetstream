import { Suspense } from 'react';
import { Metadata } from 'next';
import FlightsMarketplace from './components/flights-marketplace';
import FlightsLoading from './components/flights-loading';

export const metadata: Metadata = {
  title: 'JetStream | Flights Marketplace',
  description: 'Find and book private jet flights with JetStream\'s marketplace.'
};

export default function FlightsPage() {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="container max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 mt-4 text-center dark:text-white">Private Jet Flights</h1>
        <p className="text-center text-muted-foreground mb-8 dark:text-gray-300">
          Browse available flights and book your next luxury journey
        </p>
        
        <Suspense fallback={<FlightsLoading />}>
          <FlightsMarketplace />
        </Suspense>
      </div>
    </div>
  );
} 