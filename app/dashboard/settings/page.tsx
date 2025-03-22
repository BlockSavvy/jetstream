'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account')
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Travel Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and email preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Smith" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="john@example.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-amber-500 hover:bg-amber-600 text-black">Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password Settings</CardTitle>
              <CardDescription>
                Update your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-amber-500 hover:bg-amber-600 text-black">Update Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage how others see you on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" alt="John Smith" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="mb-1">
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. 1MB max size.
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" defaultValue="Entrepreneur and frequent traveler" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="company">Company</Label>
                <Input id="company" defaultValue="TechVenture Inc." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="job-title">Job Title</Label>
                <Input id="job-title" defaultValue="CEO" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-amber-500 hover:bg-amber-600 text-black">Save Profile</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Travel Preferences</CardTitle>
              <CardDescription>
                Customize your travel experience and AI matching preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Preferred Destinations</div>
                <Input placeholder="Add your favorite destinations (e.g., New York, Los Angeles, Miami)" />
              </div>
              <div className="space-y-2">
                <div className="font-medium">Preferred Aircraft</div>
                <Input placeholder="Add your preferred aircraft models" />
              </div>
              <div className="space-y-2">
                <div className="font-medium">Professional Networking</div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="network-pref" className="flex-1">
                    Enable professional networking with compatible travelers
                  </Label>
                  <Switch id="network-pref" defaultChecked />
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Companion Preferences</div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="similar-prof" className="flex-1">
                    Match with travelers in similar professions
                  </Label>
                  <Switch id="similar-prof" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="family-friendly" className="flex-1">
                    Family-friendly travel options
                  </Label>
                  <Switch id="family-friendly" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-amber-500 hover:bg-amber-600 text-black">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-3">Email Notifications</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="flight-updates" className="flex-1">
                        Flight updates and changes
                      </Label>
                      <Switch id="flight-updates" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="match-alerts" className="flex-1">
                        New match alerts
                      </Label>
                      <Switch id="match-alerts" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="marketing" className="flex-1">
                        Marketing and promotional content
                      </Label>
                      <Switch id="marketing" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="font-medium mb-3">Mobile Notifications</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mobile-updates" className="flex-1">
                        Flight updates via SMS
                      </Label>
                      <Switch id="mobile-updates" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mobile-reminders" className="flex-1">
                        Trip reminders
                      </Label>
                      <Switch id="mobile-reminders" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-amber-500 hover:bg-amber-600 text-black">Save Notification Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your data and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Profile Visibility</div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="profile-public" className="flex-1">
                    Make profile visible to other users
                  </Label>
                  <Switch id="profile-public" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-travel" className="flex-1">
                    Show travel history in profile
                  </Label>
                  <Switch id="show-travel" defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="font-medium">Data Usage</div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-matching" className="flex-1">
                    Use my data for AI matching and recommendations
                  </Label>
                  <Switch id="data-matching" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-analytics" className="flex-1">
                    Share anonymous data for service improvement
                  </Label>
                  <Switch id="data-analytics" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto bg-amber-500 hover:bg-amber-600 text-black">Save Privacy Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 