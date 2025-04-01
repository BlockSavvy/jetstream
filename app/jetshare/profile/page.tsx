'use client';

// Force dynamic rendering to prevent client-side code execution during static generation
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';
import { 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Wallet, 
  MessageSquare, 
  Send,
  Loader2,
  Settings,
  Save,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function JetShareProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, refreshProfile } = useUserProfile();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    phone: '',
    bio: '',
    company: '',
    position: ''
  });

  // Refresh profile when page loads
  useEffect(() => {
    if (user && !authLoading) {
      refreshProfile();
    }
  }, [user, authLoading, refreshProfile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?returnUrl=/jetshare/profile');
    }
  }, [user, authLoading, router]);

  // Update form data when profile loads/changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        full_name: profile.full_name || '',
        phone: profile.phone_number || '',
        bio: profile.bio || '',
        company: profile.company || '',
        position: profile.position || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Create full_name if first and last are provided
      let updatedData = { ...formData };
      if (formData.first_name && formData.last_name) {
        updatedData.full_name = `${formData.first_name} ${formData.last_name}`;
      }

      const result = await updateProfile({
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        full_name: updatedData.full_name,
        phone_number: updatedData.phone,
        bio: updatedData.bio,
        company: updatedData.company,
        position: updatedData.position
      });

      if (result.error) {
        toast.error(`Failed to update profile: ${result.error}`);
      } else {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        refreshProfile(); // Refresh profile data after update
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your JetShare Profile</h1>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditing(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32 border-2 border-amber-500">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-950 text-4xl">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      Verified Traveler
                    </Badge>
                  </div>
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input 
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            placeholder="First Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input 
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input 
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Company Name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input 
                          id="position"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          placeholder="Job Title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input 
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell other users about yourself"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span>
                          {profile?.first_name} {profile?.last_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>{user?.email || 'No email provided'}</span>
                      </div>
                      
                      {profile?.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <span>{profile.phone_number}</span>
                        </div>
                      )}
                      
                      {(profile?.company || profile?.position) && (
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-muted-foreground" />
                          <span>
                            {profile.position ? `${profile.position}` : ''}
                            {profile.position && profile.company ? ' at ' : ''}
                            {profile.company ? `${profile.company}` : ''}
                          </span>
                        </div>
                      )}
                      
                      {profile?.bio && (
                        <div className="mt-4 pt-4 border-t">
                          <h3 className="text-sm font-medium mb-2">About</h3>
                          <p className="text-sm text-muted-foreground">{profile.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium">No Recent Activity</h3>
                <p className="text-muted-foreground mt-1">
                  Your JetShare activity will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Button variant="outline" asChild className="w-full justify-start">
                  <a href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Account Settings
                  </a>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <a href="/settings/privacy">
                    <User className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </a>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <a href="/settings/notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Preferences
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 