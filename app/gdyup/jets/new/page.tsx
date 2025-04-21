'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewJetRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the jet add page
    router.push('/gdyup/jets/add');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-white">Redirecting to jet creation...</p>
      </div>
    </div>
  );
} 