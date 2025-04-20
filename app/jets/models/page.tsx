'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plane, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

interface AircraftModel {
  id: string;
  manufacturer: string;
  model: string;
  display_name: string; 
  seat_capacity: string;
  range_nm: string;
  cruise_speed_kts: string;
  image_url: string;
  description: string;
}

export default function ModelSelection() {
  const router = useRouter();
  const [models, setModels] = useState<AircraftModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/aircraft-models');
        
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft models');
        }
        
        const data = await response.json();
        setModels(data);
        setFilteredModels(data);
      } catch (err) {
        console.error('Error fetching aircraft models:', err);
        setError(err instanceof Error ? err.message : 'Failed to load aircraft models');
        toast.error('Could not load aircraft models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Filter models based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(models);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = models.filter(
      model => 
        model.manufacturer.toLowerCase().includes(query) ||
        model.model.toLowerCase().includes(query) ||
        model.display_name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query)
    );

    setFilteredModels(filtered);
  }, [searchQuery, models]);

  // Handle selecting a model
  const handleSelectModel = (model: AircraftModel) => {
    // Store selected model in session storage for the add form
    sessionStorage.setItem('selectedAircraftModel', JSON.stringify(model));
    router.push('/jets/add');
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Select Aircraft Model</h1>
        </div>
        
        <div className="mb-6 max-w-md">
          <Skeleton className="h-10 w-full bg-gray-800" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[#0D0D0D] border-gray-800">
              <CardHeader>
                <Skeleton className="h-5 w-40 bg-gray-800" />
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <Skeleton className="h-full w-full bg-gray-800" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gray-800" />
                  <Skeleton className="h-4 w-3/4 bg-gray-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Select Aircraft Model</h1>
      </div>
      
      {/* Search field */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by manufacturer, model or features..."
          className="pl-10 bg-gray-800 border-gray-700 focus:border-[#39FF14]"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-6 w-6 p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {error ? (
        <Card className="bg-[#0D0D0D] border-red-900 p-6">
          <div className="text-red-400">
            <h3 className="text-lg font-semibold mb-2">Error Loading Aircraft Models</h3>
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-900/60 hover:bg-red-900 text-white"
            >
              Try Again
            </Button>
          </div>
        </Card>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto rounded-full bg-gray-900 p-4 w-16 h-16 flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Models Found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            No aircraft models match your search criteria. Try different keywords.
          </p>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <Card 
              key={model.id} 
              className="bg-[#0D0D0D] border-gray-800 hover:border-[#39FF14]/50 transition-colors cursor-pointer overflow-hidden"
              onClick={() => handleSelectModel(model)}
            >
              <div className="aspect-video relative">
                {model.image_url ? (
                  <Image
                    src={model.image_url}
                    alt={model.display_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-900">
                    <Plane className="h-12 w-12 text-gray-600" />
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-bold text-lg">
                    {model.display_name}
                  </CardTitle>
                  <Badge className="bg-blue-900/80 border-blue-700">
                    {model.seat_capacity} Seats
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Range</span>
                    <span className="text-gray-200 font-medium">{model.range_nm} nm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cruise Speed</span>
                    <span className="text-gray-200 font-medium">{model.cruise_speed_kts} kts</span>
                  </div>
                  <p className="text-gray-400 mt-3 line-clamp-2">{model.description}</p>
                </div>
              </CardContent>
              
              <CardFooter className="border-t border-gray-800 pt-4">
                <Button
                  className="w-full bg-[#39FF14] hover:bg-[#32E012] text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectModel(model);
                  }}
                >
                  Select Model
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 