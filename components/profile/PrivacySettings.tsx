"use client";

import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Lock, User, Plane, Calendar, Globe, Building, Users } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function PrivacySettings() {
  const { profile, loading, updateProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default privacy settings based on the user profile or defaults
  const defaultPrivacySettings = {
    show_profile: true,
    show_travel_history: false,
    show_upcoming_flights: true,
    show_company: true,
    show_social_links: true,
    visibility_mode: 'public',
  };

  // Initialize state with profile settings or defaults
  const [privacySettings, setPrivacySettings] = useState(() => {
    if (profile?.privacy_settings) {
      return {
        ...defaultPrivacySettings,
        ...profile.privacy_settings,
      };
    }
    return defaultPrivacySettings;
  });

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPrivacySettings({
      ...privacySettings,
      [name]: checked,
    });
  };

  const handleRadioChange = (value: string) => {
    setPrivacySettings({
      ...privacySettings,
      visibility_mode: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateProfile({
        privacy_settings: privacySettings,
      });

      if (result.error) {
        toast.error('Failed to update privacy settings. Please try again.');
        console.error('Error updating privacy settings:', result.error);
      } else {
        toast.success('Privacy settings updated successfully!');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Visibility</CardTitle>
            <CardDescription>
              Control what information is visible to other users on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={privacySettings.visibility_mode} 
              onValueChange={handleRadioChange}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer" 
                onClick={() => handleRadioChange('public')}
              >
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label htmlFor="public" className="font-medium cursor-pointer">
                      <Globe className="inline-block w-4 h-4 mr-2 text-amber-500" />
                      Public Profile
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your profile is visible to all JetStream users. This helps with networking and finding travel companions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer"
                onClick={() => handleRadioChange('limited')}
              >
                <RadioGroupItem value="limited" id="limited" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label htmlFor="limited" className="font-medium cursor-pointer">
                      <Users className="inline-block w-4 h-4 mr-2 text-amber-500" />
                      Limited Profile
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your profile is only visible to users with whom you've booked flights or connected with.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer"
                onClick={() => handleRadioChange('private')}
              >
                <RadioGroupItem value="private" id="private" className="mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label htmlFor="private" className="font-medium cursor-pointer">
                      <Lock className="inline-block w-4 h-4 mr-2 text-amber-500" />
                      Private Profile
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your profile is private and not visible to other users. The system may still use your preferences for matching.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information Settings</CardTitle>
            <CardDescription>
              Choose what specific information is visible to others on JetStream
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-amber-500" />
                  Show basic profile information
                </Label>
                <p className="text-xs text-muted-foreground">
                  Name and profile picture
                </p>
              </div>
              <Switch
                id="show_profile"
                checked={privacySettings.show_profile}
                onCheckedChange={(checked) => handleSwitchChange('show_profile', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_company" className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-amber-500" />
                  Show company and position
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your professional information
                </p>
              </div>
              <Switch
                id="show_company"
                checked={privacySettings.show_company}
                onCheckedChange={(checked) => handleSwitchChange('show_company', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_social_links" className="flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-amber-500" />
                  Show social media links
                </Label>
                <p className="text-xs text-muted-foreground">
                  Twitter, LinkedIn, Instagram profiles
                </p>
              </div>
              <Switch
                id="show_social_links"
                checked={privacySettings.show_social_links}
                onCheckedChange={(checked) => handleSwitchChange('show_social_links', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_travel_history" className="flex items-center">
                  <Plane className="w-4 h-4 mr-2 text-amber-500" />
                  Show travel history
                </Label>
                <p className="text-xs text-muted-foreground">
                  Routes and destinations you've traveled to in the past
                </p>
              </div>
              <Switch
                id="show_travel_history"
                checked={privacySettings.show_travel_history}
                onCheckedChange={(checked) => handleSwitchChange('show_travel_history', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_upcoming_flights" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                  Show upcoming flights
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your scheduled flights in the near future
                </p>
              </div>
              <Switch
                id="show_upcoming_flights"
                checked={privacySettings.show_upcoming_flights}
                onCheckedChange={(checked) => handleSwitchChange('show_upcoming_flights', checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
} 