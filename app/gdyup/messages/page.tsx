'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
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
    <div className="container mx-auto px-4 py-12">
      <Card className={getThemeClasses({
        base: "border shadow-md",
        default: "bg-gray-900/90 border-gray-800",
        blue: "bg-blue-950/90 border-blue-900",
        pink: "bg-pink-950/90 border-pink-900"
      })}>
        <CardHeader className="flex flex-row items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className={getThemeClasses({
              base: "mr-2",
              default: "text-white hover:text-primary hover:bg-gray-800",
              blue: "text-blue-100 hover:text-blue-200 hover:bg-blue-900/70",
              pink: "text-pink-100 hover:text-pink-200 hover:bg-pink-900/70"
            })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={getThemeClasses({
            base: "rounded-lg p-4",
            default: "bg-gray-800/50 text-gray-300",
            blue: "bg-blue-900/50 text-blue-300",
            pink: "bg-pink-900/50 text-pink-300"
          })}>
            <p className="text-center py-4">
              {isLoading ? "Loading messages..." : "This is a placeholder for the messaging interface."}
            </p>
            <p className="text-center text-sm">
              {offerId ? `Connected to offer ID: ${offerId}` : "No offer ID provided"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 