'use client';

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
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';

export default function JetShareProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    paymentPreference: 'fiat',
    bio: ''
  });
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/jetshare/profile');
      return;
    }
    
    // Fetch profile data
    if (user) {
      const fetchProfileData = async () => {
        setIsLoading(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
          } else if (data) {
            setProfile(data);
            // Initialize form data
            setFormData({
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              phone: data.phone || '',
              paymentPreference: data.payment_preference || 'fiat',
              bio: data.bio || ''
            });
          }
        } catch (error) {
          console.error('Error in profile data fetch:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProfileData();
      
      // Fetch messages
      const fetchMessages = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('jetshare_messages')
            .select(`
              *,
              sender_profile:sender_id (first_name, last_name, avatar_url),
              recipient_profile:recipient_id (first_name, last_name, avatar_url)
            `)
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (error) {
            console.error('Error fetching messages:', error);
          } else {
            setMessages(data || []);
          }
        } catch (error) {
          console.error('Error in messages fetch:', error);
        }
      };
      
      fetchMessages();
    }
  }, [user, authLoading, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          payment_preference: formData.paymentPreference,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
        setEditMode(false);
        // Refresh profile data
        setProfile({
          ...profile,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          payment_preference: formData.paymentPreference,
          bio: formData.bio
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An error occurred while saving profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSendMessage = async (recipientId: string) => {
    if (!user || !newMessage.trim()) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('jetshare_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          message: newMessage.trim(),
          created_at: new Date().toISOString(),
          read: false
        });
        
      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      } else {
        toast.success('Message sent');
        setNewMessage('');
        // Refresh messages
        const { data } = await supabase
          .from('jetshare_messages')
          .select(`
            *,
            sender_profile:sender_id (first_name, last_name, avatar_url),
            recipient_profile:recipient_id (first_name, last_name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(20);
          
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error in send message:', error);
      toast.error('An error occurred while sending message');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your JetShare Profile</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {profile?.first_name?.[0] || ''}
                    {profile?.last_name?.[0] || ''}
                  </AvatarFallback>
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile" />}
                </Avatar>
                <div>
                  <CardTitle>
                    {editMode ? 
                      'Edit Profile' : 
                      `${profile?.first_name || 'New'} ${profile?.last_name || 'User'}`
                    }
                  </CardTitle>
                  {!editMode && profile?.verification_status && (
                    <Badge variant="outline" className={
                      profile.verification_status === 'verified' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }>
                      {profile.verification_status === 'verified' ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditMode(!editMode)}
                disabled={isSaving}
              >
                {editMode ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
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
                  
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span>{profile.phone}</span>
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
            </CardContent>
            {editMode && (
              <CardFooter>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="ml-auto"
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Credit/Debit Card Payments</h3>
                      <p className="text-sm text-muted-foreground">
                        Your card details are securely stored with our payment processor
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    profile?.payment_preference === 'fiat' || !profile?.payment_preference
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500'
                  }>
                    {profile?.payment_preference === 'fiat' || !profile?.payment_preference
                      ? 'Preferred'
                      : 'Available'
                    }
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Cryptocurrency Payments</h3>
                      <p className="text-sm text-muted-foreground">
                        Accept or make payments using cryptocurrency
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    profile?.payment_preference === 'crypto'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500'
                  }>
                    {profile?.payment_preference === 'crypto' ? 'Preferred' : 'Available'}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setEditMode(true)} className="ml-auto">
                <Settings className="h-4 w-4 mr-2" />
                Edit Payment Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender_id === user?.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.sender_id === user?.id 
                              ? 'You' 
                              : `${message.sender_profile?.first_name || 'User'} ${message.sender_profile?.last_name || ''}`
                            }
                          </span>
                          <span className="text-xs opacity-70">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p>{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                  <h3 className="text-lg font-medium mb-1">No Messages Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Your messages with other JetShare users will appear here
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSendMessage(messages[0]?.sender_id === user?.id 
                    ? messages[0]?.recipient_id 
                    : messages[0]?.sender_id
                  )}
                  disabled={!newMessage.trim() || messages.length === 0}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 