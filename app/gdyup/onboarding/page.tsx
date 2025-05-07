'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ProfileSetupForm } from '@/app/gdyup/components/onboarding/profile-setup-form';
import NostrIdentityVerifier from '@/app/gdyup/components/NostrIdentityVerifier';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { CheckCircle, Plane, User, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  const { getThemeClasses } = useGdyupTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/gdyup/auth/login?returnUrl=/gdyup/onboarding');
      return;
    }

    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/gdyup/profile?userId=${user.id}`);
        
        if (response.ok) {
          const { data } = await response.json();
          setProfile(data);
          
          // If onboarding is already complete, redirect to dashboard
          if (data.onboarding_completed) {
            router.push('/gdyup/dashboard');
            return;
          }
          
          // Set the appropriate tab based on current onboarding stage
          if (data.onboarding_step === 'nostr') {
            setActiveTab('nostr');
          } else if (data.onboarding_step === 'jet') {
            setActiveTab('jet');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, loading, router]);

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsCompleting(true);
    
    try {
      const response = await fetch('/api/gdyup/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profileData: {
            onboarding_completed: true,
            onboarding_step: 'completed'
          }
        })
      });
      
      if (response.ok) {
        toast.success('Onboarding completed successfully');
        router.push('/gdyup/dashboard');
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gdyup-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className={getThemeClasses({
        base: "border",
        default: "bg-white border-gray-200",
        blue: "bg-blue-950 border-blue-900 text-blue-50",
        pink: "bg-pink-950 border-pink-900 text-pink-50"
      })}>
        <CardHeader>
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'profile' || activeTab === 'jet' || activeTab === 'nostr' 
                  ? 'bg-gdyup-primary text-black' 
                  : 'bg-gdyup-primary/20 text-gdyup-primary'
              }`}>
                1
              </div>
              <div className="w-12 h-1 bg-gray-200">
                <div className={`h-full ${
                  activeTab === 'jet' || activeTab === 'nostr' || activeTab === 'complete' 
                    ? 'bg-gdyup-primary' 
                    : 'bg-gray-200'
                }`}></div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'jet' || activeTab === 'nostr' || activeTab === 'complete' 
                  ? 'bg-gdyup-primary text-black' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className="w-12 h-1 bg-gray-200">
                <div className={`h-full ${
                  activeTab === 'nostr' || activeTab === 'complete' 
                    ? 'bg-gdyup-primary' 
                    : 'bg-gray-200'
                }`}></div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === 'nostr' || activeTab === 'complete' 
                  ? 'bg-gdyup-primary text-black' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {activeTab === 'profile' ? 'Complete Your Profile' : 
             activeTab === 'jet' ? 'Jet Information' : 
             activeTab === 'nostr' ? 'Set Up Nostr Identity' : 
             'Ready for Takeoff!'}
          </CardTitle>
          <CardDescription className="text-center">
            {activeTab === 'profile' ? 'Tell us about yourself to get started with GDY·UP' : 
             activeTab === 'jet' ? 'Add your jet details if you have one to share' : 
             activeTab === 'nostr' ? 'Connect your decentralized identity for secure communication' : 
             'Your account is set up and ready to go'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="profile" className="mt-4">
              <ProfileSetupForm email={user?.email || ''} />
            </TabsContent>
            
            <TabsContent value="jet" className="mt-4">
              <ProfileSetupForm email={user?.email || ''} />
            </TabsContent>
            
            <TabsContent value="nostr" className="mt-4">
              <div className="space-y-6">
                <NostrIdentityVerifier 
                  onComplete={() => {
                    toast.success('Nostr identity verified');
                    setActiveTab('complete');
                  }}
                />
                
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('jet')}
                    className={getThemeClasses({
                      base: "",
                      default: "border-gray-300 hover:bg-gray-100",
                      blue: "border-blue-800 hover:bg-blue-900",
                      pink: "border-pink-800 hover:bg-pink-900"
                    })}
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('complete')}
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="complete" className="mt-4">
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className={getThemeClasses({
                    base: "text-xl font-semibold",
                    default: "text-gray-900",
                    blue: "text-blue-50",
                    pink: "text-pink-50"
                  })}>
                    All Set!
                  </h3>
                  <p className={getThemeClasses({
                    base: "max-w-md",
                    default: "text-gray-500",
                    blue: "text-blue-300",
                    pink: "text-pink-300"
                  })}>
                    Your GDY·UP account is ready to use. You can now browse available flights, create your own listings, and connect with other jet owners and passengers.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-4">
                  <div className={getThemeClasses({
                    base: "flex flex-col items-center space-y-2 p-4 rounded-lg",
                    default: "bg-gray-100",
                    blue: "bg-blue-900/30",
                    pink: "bg-pink-900/30"
                  })}>
                    <Plane className="h-6 w-6 text-gdyup-primary" />
                    <span className={getThemeClasses({
                      base: "text-sm text-center",
                      default: "text-gray-600",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>
                      Browse Flights
                    </span>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col items-center space-y-2 p-4 rounded-lg",
                    default: "bg-gray-100",
                    blue: "bg-blue-900/30",
                    pink: "bg-pink-900/30"
                  })}>
                    <User className="h-6 w-6 text-gdyup-primary" />
                    <span className={getThemeClasses({
                      base: "text-sm text-center",
                      default: "text-gray-600",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>
                      Manage Profile
                    </span>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col items-center space-y-2 p-4 rounded-lg",
                    default: "bg-gray-100",
                    blue: "bg-blue-900/30",
                    pink: "bg-pink-900/30"
                  })}>
                    <Zap className="h-6 w-6 text-gdyup-primary" />
                    <span className={getThemeClasses({
                      base: "text-sm text-center",
                      default: "text-gray-600",
                      blue: "text-blue-300",
                      pink: "text-pink-300"
                    })}>
                      Bitcoin Payments
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="mt-6 w-full max-w-xs"
                  size="lg"
                  onClick={completeOnboarding}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    'Go to Dashboard'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 