"use client";

import { useState } from 'react';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Bell, MessageSquare, Plane, Calendar, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  icon: React.ReactNode;
}

export default function NotificationPreferences() {
  const { profile, loading, updateProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default notification settings
  const defaultSettings: NotificationSetting[] = [
    {
      id: 'flight_updates',
      title: 'Flight Updates',
      description: 'Receive updates about your upcoming flights, including schedule changes and gate information.',
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      icon: <Plane className="h-5 w-5 text-amber-500" />,
    },
    {
      id: 'booking_confirmations',
      title: 'Booking Confirmations',
      description: 'Receive confirmations for new bookings and reservation changes.',
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: true,
      icon: <Calendar className="h-5 w-5 text-amber-500" />,
    },
    {
      id: 'price_alerts',
      title: 'Price Alerts',
      description: 'Get notified about special offers and price drops for flights you may be interested in.',
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: false,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
    },
    {
      id: 'security_alerts',
      title: 'Security Alerts',
      description: 'Receive important security notifications about your account.',
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: true,
      icon: <Shield className="h-5 w-5 text-amber-500" />,
    },
    {
      id: 'marketing',
      title: 'Marketing & Promotions',
      description: 'Stay updated with new features, promotions, and special offers from JetStream.',
      emailEnabled: false,
      pushEnabled: false,
      smsEnabled: false,
      icon: <Bell className="h-5 w-5 text-amber-500" />,
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Get notified when you receive messages from other users or the JetStream team.',
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      icon: <MessageSquare className="h-5 w-5 text-amber-500" />,
    },
  ];

  // If profile has notification_preferences, merge them with defaults
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(() => {
    if (profile?.notification_preferences) {
      // In a real app, you'd merge the saved preferences with defaults
      return defaultSettings;
    }
    return defaultSettings;
  });

  const toggleNotification = (index: number, type: 'emailEnabled' | 'pushEnabled' | 'smsEnabled') => {
    const newSettings = [...notificationSettings];
    newSettings[index][type] = !newSettings[index][type];
    setNotificationSettings(newSettings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform notification settings to the format expected by the API
      const notificationPreferences = {
        email: notificationSettings.some(s => s.emailEnabled),
        push: notificationSettings.some(s => s.pushEnabled),
        sms: notificationSettings.some(s => s.smsEnabled),
        settings: notificationSettings.reduce((acc, setting) => ({
          ...acc,
          [setting.id]: {
            email: setting.emailEnabled,
            push: setting.pushEnabled,
            sms: setting.smsEnabled,
          },
        }), {}),
      };

      const result = await updateProfile({
        notification_preferences: notificationPreferences,
      });

      if (result?.error) {
        toast.error('Failed to update notification preferences. Please try again.');
        console.error('Error updating notification preferences:', result.error);
      } else {
        toast.success('Notification preferences updated successfully!');
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
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications from JetStream
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Card className="flex-1 border-2 border-amber-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">Email Notifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email at {profile?.email}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">Push Notifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser and mobile device
                  </p>
                </CardContent>
              </Card>
              
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">SMS Notifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Receive time-sensitive notifications via text message
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Customize what notifications you want to receive and how
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {notificationSettings.map((setting, index) => (
              <div key={setting.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{setting.icon}</div>
                  <div>
                    <h3 className="font-medium">{setting.title}</h3>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pl-8">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${setting.id}-email`}
                      checked={setting.emailEnabled}
                      onCheckedChange={() => toggleNotification(index, 'emailEnabled')}
                    />
                    <Label htmlFor={`${setting.id}-email`}>Email</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${setting.id}-push`}
                      checked={setting.pushEnabled}
                      onCheckedChange={() => toggleNotification(index, 'pushEnabled')}
                    />
                    <Label htmlFor={`${setting.id}-push`}>Push</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${setting.id}-sms`}
                      checked={setting.smsEnabled}
                      onCheckedChange={() => toggleNotification(index, 'smsEnabled')}
                    />
                    <Label htmlFor={`${setting.id}-sms`}>SMS</Label>
                  </div>
                </div>
              </div>
            ))}
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
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
} 