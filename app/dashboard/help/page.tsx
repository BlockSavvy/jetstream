'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpCircle, MessageSquare, Mail, Phone } from 'lucide-react'

export default function HelpPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('faq')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-muted-foreground">
          Get help with your account and flights
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq" className="flex gap-2 items-center">
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex gap-2 items-center">
            <MessageSquare className="h-4 w-4" />
            <span>Contact Support</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about JetStream</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">How does fractional ownership work?</h3>
                <p className="text-muted-foreground">
                  Fractional ownership allows you to own a share of a private jet, reducing costs while maintaining access to luxury travel.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">How far in advance should I book a flight?</h3>
                <p className="text-muted-foreground">
                  We recommend booking at least 48 hours in advance for standard flights, and 7 days for international flights.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">What is the cancellation policy?</h3>
                <p className="text-muted-foreground">
                  Cancellations made 24+ hours before departure receive a full refund. Cancellations within 24 hours may incur a fee.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Reach out to our team for assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="font-medium">Phone Support</h4>
                  <p className="text-muted-foreground">1-800-JETSTREAM (1-800-538-7873)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="font-medium">Email Support</h4>
                  <p className="text-muted-foreground">support@jetstream.aiya.sh</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="font-medium">Live Chat</h4>
                  <p className="text-muted-foreground">Available 24/7 in your dashboard</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black">Start Live Chat</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 