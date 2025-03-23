'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileForm from '@/components/profile/ProfileForm'
import NotificationPreferences from '@/components/profile/NotificationPreferences'
import PrivacySettings from '@/components/profile/PrivacySettings'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('account')
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="travel-preferences">Travel Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <ProfileForm />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationPreferences />
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-4">
          <PrivacySettings />
        </TabsContent>
        
        <TabsContent value="travel-preferences" className="space-y-4">
          <div className="flex justify-between items-center mt-2 mb-6">
            <div>
              <h2 className="text-xl font-bold">Travel Preferences</h2>
              <p className="text-muted-foreground text-sm">
                Manage your travel interests and AI matching preferences
              </p>
            </div>
          </div>
          
          <iframe 
            src="/settings/travel-preferences?embedded=true" 
            className="w-full min-h-[800px] border-0"
            title="Travel Preferences"
          ></iframe>
        </TabsContent>
      </Tabs>
    </div>
  )
} 