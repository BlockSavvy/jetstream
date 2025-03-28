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
        className="text-xs text-muted-foreground"
      >
        <DatabaseIcon className="h-3 w-3 mr-1" />
        Seed Test Data
      </Button>
    );
  }
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Seed Test Offers</CardTitle>
        <CardDescription>
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
          <Label htmlFor="userId">Primary User ID</Label>
          <Input 
            id="userId" 
            placeholder="Enter user ID for offer creation" 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This user will be the creator of the offers.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secondUserId">Second User ID (Optional)</Label>
          <Input 
            id="secondUserId" 
            placeholder="Enter second user ID for matched user" 
            value={secondUserId}
            onChange={(e) => setSecondUserId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This user will be used as the matched user for accepted and completed offers.
          </p>
        </div>
        
        <div className="space-y-2 pt-2">
          <Label className="block mb-2">Data Options</Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="openOffers" 
                checked={seedOptions.openOffers}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, openOffers: checked === true }))}
              />
              <Label htmlFor="openOffers" className="text-sm">Create open offers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="acceptedOffers" 
                checked={seedOptions.acceptedOffers}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, acceptedOffers: checked === true }))}
              />
              <Label htmlFor="acceptedOffers" className="text-sm">Create accepted offers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="completedOffers" 
                checked={seedOptions.completedOffers}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, completedOffers: checked === true }))}
              />
              <Label htmlFor="completedOffers" className="text-sm">Create completed offers</Label>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="deleteExisting" 
                checked={seedOptions.deleteExisting}
                onCheckedChange={(checked) => 
                  setSeedOptions(prev => ({ ...prev, deleteExisting: checked === true }))}
              />
              <Label htmlFor="deleteExisting" className="text-sm text-destructive">Delete existing offers for these users</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setShowForm(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSeedOffers}
          disabled={isLoading}
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