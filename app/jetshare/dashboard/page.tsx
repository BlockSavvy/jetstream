import { Suspense } from 'react';
import JetShareDashboard from '../components/JetShareDashboard'; // Client component
import { createClient } from '@/lib/supabase-server'; // Server client for initial auth check if needed

interface JetShareDashboardPageProps {
    // searchParams are optional
    searchParams?: { [key: string]: string | string[] | undefined };
}


// Make the component async
export default async function JetShareDashboardPage({ searchParams }: JetShareDashboardPageProps) {
    // Get the tab from query params or default to 'dashboard'
    // Access searchParams directly
    const initialTab = searchParams?.tab || 'dashboard';
    const error = searchParams?.error;
    const message = searchParams?.message;

    // Map tab name to the expected prop value
    let mappedTab: 'dashboard' | 'offers' | 'bookings' | 'transactions' = 'dashboard';
    if (initialTab === 'offers' || initialTab === 'bookings' || initialTab === 'transactions') {
        mappedTab = initialTab;
    }

     // Optional: Perform server-side auth check if necessary before rendering client component
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   redirect('/auth/login'); // Redirect if not logged in
    // }

    console.log(`JetShareDashboardPage: Rendering with initialTab='${mappedTab}'`);


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">JetShare Dashboard</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            {message && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}

            {/* Use Suspense if JetShareDashboard needs async data on the client */}
            <Suspense fallback={<div>Loading Dashboard...</div>}>
                {/* Pass the initial tab to the client component */}
                <JetShareDashboard initialTab={mappedTab} />
            </Suspense>
        </div>
    );
} 