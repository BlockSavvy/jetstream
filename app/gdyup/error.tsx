'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowLeft, Home, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGdyupTheme } from './hooks/useGdyupTheme';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { getThemeClasses } = useGdyupTheme();
  const [offerId, setOfferId] = useState<string | null>(null);
  
  // Log the error for debugging
  useEffect(() => {
    console.error('Application error:', error);
    
    // Check for offer ID in localStorage for potential recovery
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
  }, [error]);
  
  return (
    <div className="container mx-auto px-4 max-w-md py-16">
      <Card className={getThemeClasses({
        base: "border shadow-md",
        default: "bg-gray-900 border-gray-800 text-white",
        blue: "bg-blue-950 border-blue-900 text-white",
        pink: "bg-pink-950 border-pink-900 text-white",
      })}>
        <CardHeader>
          <CardTitle className="text-xl text-center">Something went wrong</CardTitle>
          <CardDescription className={getThemeClasses({
            base: "text-center",
            default: "text-gray-400",
            blue: "text-blue-300",
            pink: "text-pink-300",
          })}>
            We're sorry, but there was an error processing your request.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className={getThemeClasses({
            base: "text-sm",
            default: "text-gray-300",
            blue: "text-blue-200",
            pink: "text-pink-200",
          })}>
            {offerId 
              ? "It looks like you were trying to access an offer or payment page. We can help you recover your session."
              : "Please try again or navigate to another page."}
          </p>
          
          {/* Show recovery options if we have an offer ID */}
          {offerId && (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <p className="text-sm font-medium">Recovery options:</p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className={getThemeClasses({
                    base: "w-full justify-start text-left",
                    default: "bg-gray-800 border-gray-700 hover:bg-gray-700",
                    blue: "bg-blue-900 border-blue-800 hover:bg-blue-800",
                    pink: "bg-pink-900 border-pink-800 hover:bg-pink-800",
                  })}
                  asChild
                >
                  <Link href={`/gdyup/offer/redirect/${offerId}?to=view`}>
                    View Offer Details
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className={getThemeClasses({
                    base: "w-full justify-start text-left",
                    default: "bg-gray-800 border-gray-700 hover:bg-gray-700",
                    blue: "bg-blue-900 border-blue-800 hover:bg-blue-800",
                    pink: "bg-pink-900 border-pink-800 hover:bg-pink-800",
                  })}
                  asChild
                >
                  <Link href={`/gdyup/offer/redirect/${offerId}?to=payment`}>
                    Go to Payment
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button
            className={getThemeClasses({
              base: "w-full",
              default: "bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]",
              blue: "bg-blue-500 text-white hover:bg-blue-600",
              pink: "bg-pink-500 text-white hover:bg-pink-600",
            })}
            onClick={reset}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button 
            className={getThemeClasses({
              base: "w-full",
              default: "bg-gray-800 text-white hover:bg-gray-700",
              blue: "bg-blue-900 text-white hover:bg-blue-800",
              pink: "bg-pink-900 text-white hover:bg-pink-800",
            })} 
            asChild
          >
            <Link href="/gdyup/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className={getThemeClasses({
              base: "w-full",
              default: "border-gray-700 hover:bg-gray-800 text-white",
              blue: "border-blue-700 hover:bg-blue-900 text-white",
              pink: "border-pink-700 hover:bg-pink-900 text-white",
            })}
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 