'use client';

import { useState } from 'react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Bitcoin, Radio, Copy, Zap, CheckCircle2, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import NostrRelayStatus from './NostrRelayStatus';
import NostrZapButton from './NostrZapButton';
import NostrVerificationBadge from './NostrVerificationBadge';
import NostrConnectionStatus from './NostrConnectionStatus';

export default function ThemeTest() {
  const { 
    theme, 
    changeTheme, 
    getThemedButtonClasses, 
    getThemedTextClasses, 
    getThemedBackgroundClasses,
    getThemedBadgeClasses
  } = useGdyupTheme();
  
  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="space-y-4">
        <h1 className={cn(getThemedTextClasses('primary'), "text-3xl font-bold")}>
          GDY·UP Theme Test
        </h1>
        
        <p className={cn(getThemedTextClasses(), "mb-6")}>
          Visual reference for all themed components across the three GDY·UP themes.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={() => changeTheme('default')}
            variant={theme === 'default' ? 'default' : 'outline'}
            className={cn(
              theme === 'default' ? getThemedButtonClasses('primary') : '',
              "relative px-6"
            )}
          >
            Lime Theme
            {theme === 'default' && (
              <Badge className="absolute -top-2 -right-2 bg-black text-white text-xs">Active</Badge>
            )}
          </Button>
          
          <Button 
            onClick={() => changeTheme('luxury')}
            variant={theme === 'luxury' ? 'default' : 'outline'}
            className={cn(
              theme === 'luxury' ? getThemedButtonClasses('primary') : '',
              "relative px-6"
            )}
          >
            Luxury Black
            {theme === 'luxury' && (
              <Badge className="absolute -top-2 -right-2 bg-black text-white text-xs">Active</Badge>
            )}
          </Button>
          
          <Button 
            onClick={() => changeTheme('bitcoin')}
            variant={theme === 'bitcoin' ? 'default' : 'outline'}
            className={cn(
              theme === 'bitcoin' ? getThemedButtonClasses('primary') : '',
              "relative px-6"
            )}
          >
            Bitcoin Orange
            {theme === 'bitcoin' && (
              <Badge className="absolute -top-2 -right-2 bg-black text-white text-xs">Active</Badge>
            )}
          </Button>
        </div>
      </header>
      
      <Separator />
      
      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="w-full max-w-md mx-auto mb-8 grid grid-cols-4">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="text">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="nostr">Nostr</TabsTrigger>
        </TabsList>
        
        {/* Buttons Tab */}
        <TabsContent value="buttons" className="space-y-8">
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Primary Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button className={getThemedButtonClasses('primary')}>Primary Button</Button>
              <Button className={getThemedButtonClasses('primary')} size="sm">Small</Button>
              <Button className={getThemedButtonClasses('primary')} size="lg">Large</Button>
              <Button className={getThemedButtonClasses('primary')} disabled>Disabled</Button>
              <Button className={getThemedButtonClasses('primary')}>
                <Zap className="mr-2 h-4 w-4" />
                With Icon
              </Button>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Secondary Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button className={getThemedButtonClasses('secondary')}>Secondary Button</Button>
              <Button className={getThemedButtonClasses('secondary')} size="sm">Small</Button>
              <Button className={getThemedButtonClasses('secondary')} size="lg">Large</Button>
              <Button className={getThemedButtonClasses('secondary')} disabled>Disabled</Button>
              <Button className={getThemedButtonClasses('secondary')}>
                <AlertCircle className="mr-2 h-4 w-4" />
                With Icon
              </Button>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Outline Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className={cn(getThemedTextClasses('primary'), "border-gdyup-primary")}>
                Outline Button
              </Button>
              <Button variant="outline" size="sm" className={cn(getThemedTextClasses('primary'), "border-gdyup-primary")}>
                Small
              </Button>
              <Button variant="outline" size="lg" className={cn(getThemedTextClasses('primary'), "border-gdyup-primary")}>
                Large
              </Button>
              <Button variant="outline" disabled className={cn(getThemedTextClasses('primary'), "border-gdyup-primary")}>
                Disabled
              </Button>
              <Button variant="outline" className={cn(getThemedTextClasses('primary'), "border-gdyup-primary")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                With Icon
              </Button>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Ghost Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="ghost" className={getThemedTextClasses('primary')}>
                Ghost Button
              </Button>
              <Button variant="ghost" size="sm" className={getThemedTextClasses('primary')}>
                Small
              </Button>
              <Button variant="ghost" size="lg" className={getThemedTextClasses('primary')}>
                Large
              </Button>
              <Button variant="ghost" disabled className={getThemedTextClasses('primary')}>
                Disabled
              </Button>
              <Button variant="ghost" className={getThemedTextClasses('primary')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                With Icon
              </Button>
            </div>
          </section>
        </TabsContent>
        
        {/* Typography Tab */}
        <TabsContent value="text" className="space-y-8">
          <section className="space-y-6 max-w-3xl mx-auto">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Headings</h2>
            
            <div className="space-y-4">
              <h1 className={getThemedTextClasses('primary')}>This is an H1 Heading</h1>
              <h2 className={getThemedTextClasses('primary')}>This is an H2 Heading</h2>
              <h3 className={getThemedTextClasses('primary')}>This is an H3 Heading</h3>
              <h4 className={getThemedTextClasses('primary')}>This is an H4 Heading</h4>
              <h5 className={getThemedTextClasses('primary')}>This is an H5 Heading</h5>
              <h6 className={getThemedTextClasses('primary')}>This is an H6 Heading</h6>
            </div>
          </section>
          
          <section className="space-y-6 max-w-3xl mx-auto">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Text Styles</h2>
            
            <div className="space-y-4">
              <p className={getThemedTextClasses()}>This is the default text style with regular weight.</p>
              <p className={cn(getThemedTextClasses(), "font-medium")}>This is medium weight text.</p>
              <p className={cn(getThemedTextClasses(), "font-bold")}>This is bold text.</p>
              <p className={getThemedTextClasses('secondary')}>This is secondary text.</p>
              <p className={getThemedTextClasses('muted')}>This is muted text, used for less important information.</p>
              <div className={cn(getThemedBackgroundClasses('primary'), "p-4 rounded-md")}>
                <p className="text-gdyup-button-text">This is text on a primary background.</p>
              </div>
            </div>
          </section>
          
          <section className="space-y-6 max-w-3xl mx-auto">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Link Styles</h2>
            
            <div className="space-y-4">
              <a href="#" className={cn(getThemedTextClasses('primary'), "underline")}>This is a standard link</a>
              <div>
                <a href="#" className={cn(getThemedTextClasses('secondary'), "underline")}>This is a secondary link</a>
              </div>
              <div className={cn(getThemedBackgroundClasses('primary'), "p-4 rounded-md")}>
                <a href="#" className="text-gdyup-button-text underline">This is a link on primary background</a>
              </div>
            </div>
          </section>
        </TabsContent>
        
        {/* Components Tab */}
        <TabsContent value="components" className="space-y-8">
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Cards</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
                <CardHeader>
                  <CardTitle className={getThemedTextClasses()}>Card Title</CardTitle>
                  <CardDescription className={getThemedTextClasses('muted')}>
                    This is a basic card component with header and content.
                  </CardDescription>
                </CardHeader>
                <CardContent className={getThemedTextClasses()}>
                  <p>This is the main content area of the card.</p>
                </CardContent>
                <CardFooter className="border-t border-gdyup-border pt-4">
                  <Button className={getThemedButtonClasses('primary')}>Action</Button>
                </CardFooter>
              </Card>
              
              <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className={getThemedTextClasses()}>Wallet Card</CardTitle>
                    <CardDescription className={getThemedTextClasses('muted')}>
                      Example of a wallet display card
                    </CardDescription>
                  </div>
                  <div className="p-2 rounded-full bg-gdyup-bg-dark">
                    <Bitcoin className="h-5 w-5 text-gdyup-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className={getThemedTextClasses('muted') + " text-sm"}>BTC Address</p>
                    <div className="flex justify-between">
                      <code className={getThemedTextClasses() + " text-sm"}>bc1q9zm4...3lla4js</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gdyup-border pt-4 flex justify-between">
                  <Badge className={getThemedBadgeClasses('secondary')}>Connected</Badge>
                  <Button className={getThemedButtonClasses('primary')} size="sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Form Elements</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={getThemedTextClasses()}>Input Field</label>
                  <Input 
                    placeholder="Type here..." 
                    className="bg-gdyup-bg-dark border-gdyup-border text-gdyup-text" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className={getThemedTextClasses()}>Disabled Input</label>
                  <Input 
                    placeholder="Disabled" 
                    disabled 
                    className="bg-gdyup-bg-dark border-gdyup-border text-gdyup-text" 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="dark-mode" />
                  <label htmlFor="dark-mode" className={getThemedTextClasses()}>
                    Toggle Switch
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className={getThemedTextClasses()}>Badge Variations</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getThemedBadgeClasses('primary')}>Primary</Badge>
                    <Badge className={getThemedBadgeClasses('secondary')}>Secondary</Badge>
                    <Badge className={getThemedBadgeClasses('outline')}>Outline</Badge>
                    <Badge className={getThemedBadgeClasses('success')}>Success</Badge>
                    <Badge className={getThemedBadgeClasses('warning')}>Warning</Badge>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
        
        {/* Nostr Tab */}
        <TabsContent value="nostr" className="space-y-8">
          <section className="space-y-4">
            <h2 className={cn(getThemedTextClasses(), "text-xl font-bold")}>Nostr Components</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
                <CardHeader>
                  <CardTitle className={getThemedTextClasses()}>Relay Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <NostrRelayStatus isConnected={true} />
                      <span className={getThemedTextClasses()}>Connected State</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NostrRelayStatus isConnected={false} />
                      <span className={getThemedTextClasses()}>Disconnected State</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
                <CardHeader>
                  <CardTitle className={getThemedTextClasses()}>Zap Button</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <NostrZapButton amount={1000} showAmount={true} />
                      <span className={getThemedTextClasses()}>Default</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NostrZapButton amount={5000} showAmount={true} size="sm" />
                      <span className={getThemedTextClasses()}>Small</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NostrZapButton amount={21000} showAmount={true} size="lg" />
                      <span className={getThemedTextClasses()}>Large</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
                <CardHeader>
                  <CardTitle className={getThemedTextClasses()}>Verification Badge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <NostrVerificationBadge nip05="user@gdyup.com" nip05_verified={true} />
                      <span className={getThemedTextClasses()}>Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NostrVerificationBadge nip05="user@gdyup.com" nip05_verified={false} />
                      <span className={getThemedTextClasses()}>Unverified</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={cn(getThemedBackgroundClasses('card'), "border-gdyup-border")}>
                <CardHeader>
                  <CardTitle className={getThemedTextClasses()}>Connection Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <NostrConnectionStatus />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
} 