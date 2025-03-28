import { Metadata } from 'next';
import JetShareListingsContent from '../components/JetShareListingsContent';
import { createClient } from '@/lib/supabase-server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'JetStream - Available Flight Shares',
  description: 'Browse and book available flight shares on private jets.',
};

export default async function JetShareListingsPage() {
  console.log('Public JetShare route /jetshare/listings, allowing access');
  
  // Attempt to get the authenticated user to pass to the listings content
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user || null;
  
  if (error) {
    console.error('Auth error in JetShare listings page:', error);
  }
  
  // If we have a user, log it (but allow the page to load even without a user)
  if (user) {
    console.log('User authenticated for JetShare listings:', user.id, user.email);
  } else {
    console.log('No authenticated user for JetShare listings, allowing public access');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Find Available Flight Shares</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Find Your Perfect Flight Share</CardTitle>
            <CardDescription>Browse available flight shares and connect with fellow travelers.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Use filters and search to find the ideal flight share that matches your travel plans.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Secure Booking</CardTitle>
            <CardDescription>Safe and transparent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Book with confidence using our secure payment system and verified user profiles.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instant Confirmation</CardTitle>
            <CardDescription>Quick and seamless process.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Get instant confirmation and connect with the flight organizer right away.</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Render the component regardless of authentication status */}
      <JetShareListingsContent user={user} />
    </div>
  );
} 