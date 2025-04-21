'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { Container } from '@/app/gdyup/components/container';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ProfileSetupForm } from '@/app/gdyup/components/onboarding/profile-setup-form';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setEmail(user.email || '');
        setIsReady(true);
      } else {
        // No user - redirect to login
        router.push('/gdyup/auth/login?returnUrl=/gdyup/profile');
      }
    }
  }, [loading, user, router]);

  if (loading || !isReady) {
    return (
      <Container className="flex flex-col min-h-screen bg-gray-900">
        <div className="flex-grow flex flex-col justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col min-h-screen bg-gray-900">
      <div className="py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/gdyup/dashboard')}
            className="mr-4 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        </div>
        
        <div className="w-full max-w-lg mx-auto">
          <div className="mb-6">
            <p className="text-gray-400">
              Update your personal information below. These details help us personalize your experience.
            </p>
          </div>
          
          <div className="bg-black/50 rounded-xl p-6 shadow-xl border border-gray-800">
            <ProfileSetupForm email={email} />
          </div>
        </div>
      </div>
    </Container>
  );
} 