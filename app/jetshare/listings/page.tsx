import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import JetShareListingsContent from '../components/JetShareListingsContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Browse Flight Shares | JetShare',
  description: 'Browse and find available private jet flight shares from verified users and save on your luxury travel costs.',
};

export default function JetShareListingsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/jetshare" className="text-amber-500 hover:text-amber-600 flex items-center mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to JetShare
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Available Flight Shares</h1>
        <p className="text-muted-foreground">
          Browse available flight shares and find your next private jet experience at a fraction of the cost.
        </p>
      </div>
      
      <JetShareListingsContent />
    </div>
  );
} 