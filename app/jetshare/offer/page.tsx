import { Metadata } from 'next';
import JetShareOfferForm from '../components/JetShareOfferForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offer a Flight Share | JetShare',
  description: 'Create a new flight share offer and offset your private jet costs by sharing with verified users.',
};

export default function OfferFlightSharePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/jetshare" className="text-amber-500 hover:text-amber-600 flex items-center mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to JetShare
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Offer a Flight Share</CardTitle>
          <CardDescription>
            Share the details of your private jet flight and how much of the cost you'd like to offset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JetShareOfferForm />
        </CardContent>
      </Card>
    </div>
  );
} 