'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plane, Info, CheckCircle, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Define interface for aircraft models
interface AircraftModel {
  id: string;
  manufacturer: string;
  model: string;
  capacity: number;
  range_nm: number;
  cruise_speed_kts: number;
  category: string;
  image_url?: string;
  description?: string;
}

// Sample data for aircraft models
const SAMPLE_MODELS: AircraftModel[] = [
  {
    id: 'g650',
    manufacturer: 'Gulfstream',
    model: 'G650',
    capacity: 19,
    range_nm: 7000,
    cruise_speed_kts: 516,
    category: 'Heavy Jet',
    image_url: '/images/jets/gulfstream/g650.jpg',
    description: 'The flagship of the Gulfstream fleet, the G650 offers exceptional comfort and performance.',
  },
  {
    id: 'global7500',
    manufacturer: 'Bombardier',
    model: 'Global 7500',
    capacity: 19,
    range_nm: 7700,
    cruise_speed_kts: 516,
    category: 'Heavy Jet',
    image_url: '/images/jets/bombardier/global7500.jpg',
    description: 'The Global 7500 offers unmatched performance with the smoothest ride and longest range.',
  },
  {
    id: 'falcon8x',
    manufacturer: 'Dassault',
    model: 'Falcon 8X',
    capacity: 16,
    range_nm: 6450,
    cruise_speed_kts: 488,
    category: 'Heavy Jet',
    image_url: '/images/jets/dassault/falcon8x.jpg',
    description: 'The Dassault Falcon 8X offers outstanding range and exceptional short-field performance.',
  },
  {
    id: 'citation-longitude',
    manufacturer: 'Cessna',
    model: 'Citation Longitude',
    capacity: 12,
    range_nm: 3500,
    cruise_speed_kts: 476,
    category: 'Super-Midsize Jet',
    image_url: '/images/jets/cessna/citation_longitude.jpg',
    description: 'The Citation Longitude offers best-in-class comfort with the lowest cabin altitude.',
  },
  {
    id: 'phenom300',
    manufacturer: 'Embraer',
    model: 'Phenom 300',
    capacity: 10,
    range_nm: 2010,
    cruise_speed_kts: 453,
    category: 'Light Jet',
    image_url: '/images/jets/embraer/phenom300.jpg',
    description: 'The Phenom 300 is a light jet with best-in-class speed, range, and cabin pressurization.',
  },
  {
    id: 'pc24',
    manufacturer: 'Pilatus',
    model: 'PC-24',
    capacity: 11,
    range_nm: 2000,
    cruise_speed_kts: 440,
    category: 'Light Jet',
    image_url: '/images/jets/pilatus/pc24.jpg',
    description: 'The Pilatus PC-24 offers unparalleled versatility with its ability to use short and unpaved runways.',
  },
];

export default function JetModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulating API fetch for aircraft models
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        // In a real implementation, fetch from API:
        // const response = await fetch('/api/aircraft-models');
        // const data = await response.json();
        // setModels(data.models);
        
        // For now, use sample data with a simulated delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setModels(SAMPLE_MODELS);
      } catch (err) {
        console.error('Error fetching aircraft models:', err);
        setError('Failed to load aircraft models. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);
  
  // Function to handle model selection
  const selectModel = (model: AircraftModel) => {
    // In a real implementation, this would navigate to a form to add details about this jet
    router.push(`/gdyup/jets/new?manufacturer=${model.manufacturer}&model=${model.model}`);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Loader2 className="h-10 w-10 text-[#DAFF0D] animate-spin mb-4" />
        <p className="text-white">Loading aircraft models...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Info className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-red-500 font-medium mb-2">Error</p>
        <p className="text-white text-center mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="bg-transparent border-white text-white hover:bg-white/10"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/gdyup/jets')}
            className="mr-2 p-0 h-10 w-10 rounded-full bg-black/30"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Select Aircraft Model</h1>
        </div>
      </div>
      
      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card 
            key={model.id}
            className="bg-gray-900 border-gray-800 overflow-hidden hover:border-[#DAFF0D]/50 transition-all duration-300 cursor-pointer"
            onClick={() => selectModel(model)}
          >
            {/* Aircraft Image */}
            <div className="relative h-48 w-full bg-gray-800">
              {model.image_url ? (
                <Image
                  src={model.image_url}
                  alt={`${model.manufacturer} ${model.model}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-black/50">
                  <Plane className="h-16 w-16 text-gray-700" />
                </div>
              )}
              
              {/* Category Badge */}
              <Badge className="absolute top-2 right-2 bg-black/70 text-[#DAFF0D] border-none">
                {model.category}
              </Badge>
            </div>
            
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-white text-lg">
                {model.manufacturer} {model.model}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-3">
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">Capacity:</span>
                  <span className="text-white">{model.capacity} seats</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">Range:</span>
                  <span className="text-white">{model.range_nm} nm</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">Speed:</span>
                  <span className="text-white">{model.cruise_speed_kts} kts</span>
                </div>
              </div>
              
              {model.description && (
                <p className="text-gray-400 text-sm line-clamp-2">{model.description}</p>
              )}
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full bg-[#DAFF0D] hover:bg-[#E8FF4D] text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  selectModel(model);
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Select Model
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 