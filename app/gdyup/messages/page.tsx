'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemedIcon } from '../components/core/ThemedIcon';

// Extract the component that uses searchParams to properly handle suspense
function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerId = searchParams?.get('offer');
  const [isLoading, setIsLoading] = useState(false);
  const { getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();

  useEffect(() => {
    // In a real app, we would fetch messages here
    console.log(`Fetching messages for offer: ${offerId}`);
  }, [offerId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className={cn("mb-4", getThemedButtonClasses('ghost'))}
        onClick={() => router.back()}
      >
        <ThemedIcon icon={ArrowLeft} className="mr-2" size={16} />
        Back
      </Button>
      
      <Card className={cn(
        "w-full min-h-[85vh]",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-lg md:text-xl",
            getThemedTextClasses()
          )}>Messages</CardTitle>
          <CardDescription className={getThemedTextClasses('muted')}>
            Communicate with your flight partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={cn(
            "text-center py-8",
            getThemedTextClasses('muted')
          )}>
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
        <ThemedIcon icon={Loader2} className="h-8 w-8 animate-spin text-gdyup-primary" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
} 