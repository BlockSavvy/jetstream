import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'JetStream | Booking Confirmation',
  description: 'Your private jet booking is confirmed.'
};

export default function BookingConfirmationPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Check className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">
            Your private jet booking was successful.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold">Confirmation Email</h3>
              <p className="text-sm text-muted-foreground">
                A confirmation email with your e-ticket and booking details has been sent to your email address.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-semibold">Booking Management</h3>
              <p className="text-sm text-muted-foreground">
                You can view and manage your booking from your account dashboard. If you need to make any changes, please contact our customer service at least 48 hours before departure.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-semibold">Payment Status</h3>
              <p className="text-sm text-muted-foreground">
                Your payment has been processed successfully. If you paid with cryptocurrency, your booking will be automatically confirmed once the transaction is verified on the blockchain.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                View My Bookings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/flights">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Flights
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
} 