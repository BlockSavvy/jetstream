'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Extract the component that uses searchParams to properly handle suspense
function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams?.get('offer');
  const [isLoading, setIsLoading] = useState(false);
  const { getThemeClasses } = useGdyupTheme();

  useEffect(() => {
    // In a real app, we would fetch messages here
    console.log(`Fetching messages for offer: ${offerId}`);
  }, [offerId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card className={getThemeClasses({
        base: "border shadow-sm",
        default: "bg-white border-gray-200",
        blue: "bg-blue-950/40 border-blue-900/60",
        pink: "bg-pink-950/40 border-pink-900/60"
      })}>
        <CardHeader>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-gray-900",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={getThemeClasses({
            base: "text-center py-8",
            default: "text-gray-500",
            blue: "text-blue-300",
            pink: "text-pink-300"
          })}>
            {offerId 
              ? `Messages for offer ${offerId} will appear here.` 
              : "Select a flight to view messages."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
} 