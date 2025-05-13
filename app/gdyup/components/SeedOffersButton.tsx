'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, DatabaseIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

export default function SeedOffersButton() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [secondUserId, setSecondUserId] = useState('');
  const [seedOptions, setSeedOptions] = useState({
    openOffers: true,
    acceptedOffers: true,
    completedOffers: true,
    deleteExisting: false
  });
  
  // Theme helpers
  const { 
    getThemedTextClasses, 
    getThemedButtonClasses, 
    getThemedBackgroundClasses,
    getThemedBadgeClasses
  } = useGdyupTheme();
  
  const handleSeedOffers = async () => {
    if (!userId.trim()) {
      toast.error('Please enter a valid user ID');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/jetshare/seedOffers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          secondUserId: secondUserId.trim() || undefined,
          options: seedOptions
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to seed offers');
      }
      
      const data = await response.json();
      
      toast.success(`Successfully seeded ${data.count} offers`);
      setShowForm(false);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error seeding offers:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to seed offers');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!showForm) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowForm(true)}
        className={cn("text-xs", getThemedTextClasses('muted'))}
      >
        <DatabaseIcon className="h-3 w-3 mr-1" />
        Seed Test Data
      </Button>
    );
  }
  
  return (
    <Card className={cn(
      "max-w-md mx-auto",
      getThemedBackgroundClasses('card'),
      "border border-gdyup-border"
    )}>
      <CardHeader>
        <CardTitle className={cn("text-lg", getThemedTextClasses())}>Seed Test Offers</CardTitle>
        <CardDescription className={getThemedTextClasses('muted')}>
          Create sample JetShare offers for testing purposes. This will create a variety of offers with different statuses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 mb-4 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
          <p className="text-sm">
            This tool is for development purposes only. It will create sample data in the database.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="userId" className={getThemedTextClasses()}>Primary User ID</Label>
          <Input 
            id="userId" 
            placeholder="Enter user ID for offer creation" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={cn(
              getThemedBackgroundClasses('card'),
              "border border-gdyup-border",
              getThemedTextClasses()
            )}
          />
          <p className={cn("text-xs", getThemedTextClasses('muted'))}>
            This user will be the creator of the offers.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secondUserId" className={getThemedTextClasses()}>Second User ID (Optional)</Label>
          <Input 
            id="secondUserId" 
            placeholder="Enter second user ID for matched user" 
            value={secondUserId}
            onChange={(e) => setSecondUserId(e.target.value)}
            className={cn(
              getThemedBackgroundClasses('card'),
              "border border-gdyup-border",
              getThemedTextClasses()
            )}
          />
          <p className={cn("text-xs", getThemedTextClasses('muted'))}>
            This user will be used as the matched user for accepted and completed offers.
          </p>
        </div>
        
        <div className="space-y-2 pt-2">
          <Label className={cn("block mb-2", getThemedTextClasses())}>Data Options</Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="openOffers" 
                checked={seedOptions.openOffers}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, openOffers: checked === true }))}
                className="data-[state=checked]:bg-gdyup-primary data-[state=checked]:border-gdyup-primary"
              />
              <Label htmlFor="openOffers" className={cn("text-sm", getThemedTextClasses())}>Create open offers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="acceptedOffers" 
                checked={seedOptions.acceptedOffers}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, acceptedOffers: checked === true }))}
                className="data-[state=checked]:bg-gdyup-primary data-[state=checked]:border-gdyup-primary"
              />
              <Label htmlFor="acceptedOffers" className={cn("text-sm", getThemedTextClasses())}>Create accepted offers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="completedOffers" 
                checked={seedOptions.completedOffers}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, completedOffers: checked === true }))}
                className="data-[state=checked]:bg-gdyup-primary data-[state=checked]:border-gdyup-primary"
              />
              <Label htmlFor="completedOffers" className={cn("text-sm", getThemedTextClasses())}>Create completed offers</Label>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="deleteExisting" 
                checked={seedOptions.deleteExisting}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, deleteExisting: checked === true }))}
                className="data-[state=checked]:bg-gdyup-secondary data-[state=checked]:border-gdyup-secondary"
              />
              <Label htmlFor="deleteExisting" className={cn("text-sm", getThemedTextClasses('destructive'))}>Delete existing offers for these users</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setShowForm(false)}
          disabled={isLoading}
          className={getThemedButtonClasses('outline')}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSeedOffers}
          disabled={isLoading}
          className={getThemedButtonClasses()}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Seeding...
            </>
          ) : (
            'Seed Offers'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 