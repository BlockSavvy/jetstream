import { createClient } from '@/lib/supabase-server';
import JetShareDashboard from '../components/JetShareDashboard';
import { redirect } from 'next/navigation';

interface JetShareDashboardPageProps {
  searchParams?: {
    tab?: string;
    error?: string;
    message?: string;
  };
}

export default async function JetShareDashboardPage({ searchParams }: JetShareDashboardPageProps) {
  // Get the tab from query params or default to 'dashboard'
  const initialTab = searchParams?.tab || 'dashboard';
  const error = searchParams?.error;
  const message = searchParams?.message;
  
  // Map tab name to the expected prop value
  let mappedTab: 'dashboard' | 'offers' | 'bookings' | 'transactions' = 'dashboard';
  if (initialTab === 'myOffers' || initialTab === 'offers') {
    mappedTab = 'offers';
  } else if (initialTab === 'myBookings' || initialTab === 'bookings') {
    mappedTab = 'bookings';
  } else if (initialTab === 'transactions') {
    mappedTab = 'transactions';
  }
  
  // Fetch the user but let layout handle redirects for auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Redirect to sign in if not authenticated
    redirect('/auth/signin?redirect=/jetshare/dashboard');
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <JetShareDashboard 
        initialTab={mappedTab} 
        errorMessage={error} 
        successMessage={message}
      />
    </div>
  );
} 