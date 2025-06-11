'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plane, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';

export default function JetSettingsPage() {
  const params = useParams();
  const router = useRouter();
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
          <h1 className="text-xl font-semibold">Jet Settings</h1>
        </div>
        
        <Card className="bg-[#0D0D0D] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => navigateTo(`/gdyup/jets/${jetId}/edit`)}
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
              >
                <Settings className="h-4 w-4 mr-2 text-[#DAFF0D]" />
                Edit Jet Information
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigateTo(`/gdyup/offer/new?jet=${jetId}`)}
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
              >
                <Plane className="h-4 w-4 mr-2 text-[#DAFF0D]" />
                Create Offer with this Jet
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#0D0D0D] border-gray-800 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Actions in this section can't be undone. Please proceed with caution.
              </p>
              <Button
                variant="destructive"
                className="w-full bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-white"
                onClick={() => {
                  if (confirm('Are you sure you want to deactivate this jet? It will no longer be visible in your fleet.')) {
                    // Here you would implement the deactivation logic
                    alert('This feature is coming soon.');
                  }
                }}
              >
                Deactivate Jet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 