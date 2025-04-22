'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';

export default function JetEditPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const jetId = params?.id as string;
  
  // Function for direct navigation
  const navigateTo = (path: string) => {
    window.location.href = path;
  };
  
  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateTo(`/gdyup/jets/${jetId}`)}
            className="mr-4 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Jet</h1>
        </div>
        
        <Card className="bg-[#0D0D0D] border-gray-800 p-6 text-center">
          <div className="flex flex-col items-center py-8">
            <h3 className="text-xl font-semibold mb-2">Edit Jet Feature Coming Soon</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              The ability to edit jets is currently under development. Check back soon!
            </p>
            <Button
              onClick={() => navigateTo(`/gdyup/jets/${jetId}`)}
              className="bg-[#DAFF0D] hover:brightness-105 text-black"
            >
              Back to Jet Details
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 