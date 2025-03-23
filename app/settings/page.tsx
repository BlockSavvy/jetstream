'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileForm from '@/components/profile/ProfileForm'
import NotificationPreferences from '@/components/profile/NotificationPreferences'
import PrivacySettings from '@/components/profile/PrivacySettings'
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null // We're redirecting, no need to render anything
  }

  return (
    <div className="container py-10 mt-16">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Account Settings</h1>
      
      <Tabs defaultValue="account" className="space-y-4" onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="travel-preferences">Travel Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <ProfileForm />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>
        
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
        
        <TabsContent value="travel-preferences">
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