'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Loader2, 
  Plane,
  User,
  Tag,
  MapPin,
  DollarSign,
  Sofa,
  Wifi,
  Monitor,
  BookOpen,
  Utensils,
  BedDouble
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { getUsers } from '../../utils/data-fetching';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import { useUi } from '../ui-context';

interface AircraftModel {
  id: string;
  manufacturer: string;
  model: string;
  display_name: string;
  seat_capacity: number;
  range_nm?: number;
  cruise_speed_kts?: number;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_type?: string;
}

// Dynamically import the SeatLayoutConfigurator with fallback
const SeatLayoutConfigurator = dynamic(
  () => import('../seat-layout-configurator').then(mod => mod.SeatLayoutConfigurator),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 text-center">
        <p className="text-sm text-gray-500">Loading seat configurator...</p>
      </div>
    )
  }
);

export function JetCreateDialog() {
  const { jetCreateOpen, closeJetDialogs, refreshJets } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [modelSearchText, setModelSearchText] = useState('');
  
  // Aircraft models list
  const [aircraftModels, setAircraftModels] = useState<AircraftModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Users list (for owners)
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Main form data
  const [formData, setFormData] = useState({
    owner_id: '',
    model: '',
    manufacturer: '',
    year: new Date().getFullYear().toString(),
    tail_number: '',
    capacity: '0',
    range_nm: '0',
    cruise_speed_kts: '0',
    home_base_airport: '',
    status: 'available',
    hourly_rate: '0',
    description: '',
    category: 'Light Jet',
    image_url: ''
  });
  
  // Interior form data
  const [interiorData, setInteriorData] = useState({
    interior_type: 'Standard',
    seats: '0',
    berths: false,
    lavatory: false,
    galley: false,
    entertainment: '',
    wifi: false,
    interior_image_url: '',
    notes: ''
  });
  
  // Seat layout configuration
  const [skipPositions, setSkipPositions] = useState<number[][]>([]);
  const [layoutRows, setLayoutRows] = useState(2);
  const [layoutSeatsPerRow, setLayoutSeatsPerRow] = useState(2);
  const [seatLayout, setSeatLayout] = useState({
    rows: 2,
    seatsPerRow: 2,
    layoutType: 'standard',
    skipPositions: [] as number[][]
  });
  
  // Fetch aircraft models
  useEffect(() => {
    const fetchAircraftModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await fetch('/api/jetshare/getAircraftModels');
        const data = await response.json();
        
        if (data && data.aircraft_models && data.aircraft_models.length > 0) {
          setAircraftModels(data.aircraft_models);
        } else {
          console.error('No aircraft models found');
          toast.error('Failed to load aircraft models');
        }
      } catch (error) {
        console.error('Error fetching aircraft models:', error);
        toast.error('Failed to load aircraft models');
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    fetchAircraftModels();
  }, []);
  
  // Fetch owner users (user_type = 'owner')
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const allUsers = await getUsers();
        // Filter for users who are owners
        const ownerUsers = allUsers.filter(user => 
          user.user_type === 'owner' || user.user_type === 'admin'
        );
        setUsers(ownerUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Handle selecting an aircraft model template
  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    
    const selectedModel = aircraftModels.find(model => model.id === modelId);
    if (selectedModel) {
      // Update main jet data from template
      setFormData(prev => ({
        ...prev,
        manufacturer: selectedModel.manufacturer,
        model: selectedModel.model,
        capacity: selectedModel.seat_capacity.toString(),
        range_nm: selectedModel.range_nm?.toString() || '0',
        cruise_speed_kts: selectedModel.cruise_speed_kts?.toString() || '0',
        description: selectedModel.description || '',
        image_url: selectedModel.image_url || ''
      }));
      
      // Also update interior seats
      setInteriorData(prev => ({
        ...prev,
        seats: selectedModel.seat_capacity.toString()
      }));
      
      // Set seat layout based on capacity
      const seats = selectedModel.seat_capacity;
      let rows = 0;
      let seatsPerRow = 0;
      
      // Calculate a reasonable layout
      if (seats <= 4) {
        rows = 2;
        seatsPerRow = 2;
      } else if (seats <= 8) {
        rows = 2;
        seatsPerRow = 4;
      } else if (seats <= 12) {
        rows = 3;
        seatsPerRow = 4;
      } else if (seats <= 16) {
        rows = 4;
        seatsPerRow = 4;
      } else {
        rows = 5;
        seatsPerRow = 4;
      }
      
      setLayoutRows(rows);
      setLayoutSeatsPerRow(seatsPerRow);
      
      setSeatLayout({
        rows,
        seatsPerRow,
        layoutType: 'standard',
        skipPositions: []
      });
    }
  };
  
  // Basic form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInteriorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInteriorData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInteriorSelectChange = (name: string, value: string) => {
    setInteriorData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBooleanChange = (name: string, checked: boolean) => {
    setInteriorData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Update layout when rows/seatsPerRow change
  useEffect(() => {
    setSeatLayout(prev => ({
      ...prev,
      rows: layoutRows,
      seatsPerRow: layoutSeatsPerRow
    }));
  }, [layoutRows, layoutSeatsPerRow]);
  
  // Handle seat layout updates from the configurator
  const handleSeatLayoutChange = (layout: any) => {
    setSeatLayout(layout);
    setSkipPositions(layout.skipPositions || []);
  };
  
  // Filter models by search text
  const filteredModels = aircraftModels.filter(model => {
    const searchTextLower = modelSearchText.toLowerCase();
    return (
      model.display_name.toLowerCase().includes(searchTextLower) ||
      model.manufacturer.toLowerCase().includes(searchTextLower) ||
      model.model.toLowerCase().includes(searchTextLower)
    );
  });
  
  // Submit form to create new jet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tail_number) {
      toast.error('Tail number is required');
      return;
    }
    
    if (!formData.owner_id) {
      toast.error('Owner is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // 1. Create the jet record
      const { data: jetData, error: jetError } = await supabase
        .from('jets')
        .insert({
          owner_id: formData.owner_id,
          model: formData.model,
          manufacturer: formData.manufacturer,
          year: parseInt(formData.year),
          tail_number: formData.tail_number,
          capacity: parseInt(formData.capacity),
          range_nm: parseInt(formData.range_nm),
          cruise_speed_kts: parseInt(formData.cruise_speed_kts),
          home_base_airport: formData.home_base_airport,
          status: formData.status,
          hourly_rate: parseInt(formData.hourly_rate),
          description: formData.description,
          category: formData.category,
          image_url: formData.image_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (jetError) throw jetError;
      
      if (!jetData || !jetData.id) {
        throw new Error('Failed to create jet - no ID returned');
      }
      
      const jetId = jetData.id;
      
      // 2. Create the jet interior record
      const { error: interiorError } = await supabase
        .from('jet_interiors')
        .insert({
          jet_id: jetId,
          interior_type: interiorData.interior_type,
          seats: parseInt(interiorData.seats),
          berths: interiorData.berths,
          lavatory: interiorData.lavatory,
          galley: interiorData.galley,
          entertainment: interiorData.entertainment,
          wifi: interiorData.wifi,
          interior_image_url: interiorData.interior_image_url,
          notes: interiorData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (interiorError) {
        console.error('Error creating jet interior:', interiorError);
        // Continue anyway - we at least have the jet created
      }
      
      // 3. Store the seat layout configuration for use with the visualizer
      try {
        const { error: layoutError } = await supabase
          .from('jet_seat_layouts')
          .insert({
            jet_id: jetId,
            layout: {
              rows: seatLayout.rows,
              seatsPerRow: seatLayout.seatsPerRow,
              layoutType: seatLayout.layoutType,
              skipPositions: seatLayout.skipPositions
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (layoutError) {
          console.error('Error storing seat layout:', layoutError);
          // Continue anyway - we have the jet and interior
        }
      } catch (layoutErr) {
        console.error('Exception storing seat layout:', layoutErr);
        // Continue - non-critical
      }
      
      toast.success('Jet created successfully');
      closeJetDialogs();
      refreshJets();
      
      // Reset the form
      setFormData({
        owner_id: '',
        model: '',
        manufacturer: '',
        year: new Date().getFullYear().toString(),
        tail_number: '',
        capacity: '0',
        range_nm: '0',
        cruise_speed_kts: '0',
        home_base_airport: '',
        status: 'available',
        hourly_rate: '0',
        description: '',
        category: 'Light Jet',
        image_url: ''
      });
      
      setInteriorData({
        interior_type: 'Standard',
        seats: '0',
        berths: false,
        lavatory: false,
        galley: false,
        entertainment: '',
        wifi: false,
        interior_image_url: '',
        notes: ''
      });
      
    } catch (error: any) {
      console.error('Error creating jet:', error);
      toast.error(`Failed to create jet: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={jetCreateOpen} onOpenChange={closeJetDialogs}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Jet</DialogTitle>
          <DialogDescription>
            Add a new jet to your fleet by selecting a template or entering details manually.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="template">Aircraft Template</TabsTrigger>
            <TabsTrigger value="details">Jet Details</TabsTrigger>
            <TabsTrigger value="interior">Interior & Layout</TabsTrigger>
          </TabsList>
          
          {/* AIRCRAFT MODEL TEMPLATE SELECTION */}
          <TabsContent value="template" className="p-1 space-y-4">
            <div className="mb-4">
              <Label htmlFor="modelSearch" className="text-sm font-medium">Search Aircraft Models</Label>
              <Input
                id="modelSearch"
                value={modelSearchText}
                onChange={(e) => setModelSearchText(e.target.value)}
                placeholder="Search by manufacturer, model, or display name..."
                className="mt-1"
              />
            </div>
            
            {isLoadingModels ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {filteredModels.map(model => (
                  <div 
                    key={model.id} 
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-amber-500 ${selectedModelId === model.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950' : 'border-gray-200 dark:border-gray-800'}`}
                    onClick={() => handleSelectModel(model.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{model.display_name}</h3>
                      <span className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5 rounded-full">
                        {model.seat_capacity} seats
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {model.range_nm && `Range: ${model.range_nm.toLocaleString()} nm`}
                    </div>
                    {model.image_url && (
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden mt-2">
                        <img 
                          src={model.image_url} 
                          alt={model.display_name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, replace with placeholder
                            (e.target as HTMLImageElement).src = '/images/jets/placeholder.jpg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {filteredModels.length === 0 && (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No aircraft models found matching your search.
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('details')}
                disabled={isSubmitting}
              >
                Continue to Details
              </Button>
            </div>
          </TabsContent>
          
          {/* JET DETAILS */}
          <TabsContent value="details" className="p-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_id" className="text-sm font-medium">Owner</Label>
                <Select
                  value={formData.owner_id}
                  onValueChange={(value) => handleSelectChange('owner_id', value)}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingUsers ? "Loading owners..." : "Select owner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} {user.email ? `(${user.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tail_number" className="text-sm font-medium">Tail Number</Label>
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="tail_number"
                    name="tail_number"
                    value={formData.tail_number}
                    onChange={handleChange}
                    placeholder="E.g., N123AB"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manufacturer" className="text-sm font-medium">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="E.g., Gulfstream"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium">Model</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="E.g., G650"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-medium">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min="1970"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="E.g., 2020"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium">Passenger Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="E.g., 8"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="range_nm" className="text-sm font-medium">Range (NM)</Label>
                <Input
                  id="range_nm"
                  name="range_nm"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.range_nm}
                  onChange={handleChange}
                  placeholder="E.g., 5000"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cruise_speed_kts" className="text-sm font-medium">Cruise Speed (kts)</Label>
                <Input
                  id="cruise_speed_kts"
                  name="cruise_speed_kts"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.cruise_speed_kts}
                  onChange={handleChange}
                  placeholder="E.g., 500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="home_base_airport" className="text-sm font-medium">Home Base</Label>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="home_base_airport"
                    name="home_base_airport"
                    value={formData.home_base_airport}
                    onChange={handleChange}
                    placeholder="E.g., LAX"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-sm font-medium">Hourly Rate ($)</Label>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    placeholder="E.g., 5000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Light Jet">Light Jet</SelectItem>
                    <SelectItem value="Mid-Size Jet">Mid-Size Jet</SelectItem>
                    <SelectItem value="Super Mid-Size Jet">Super Mid-Size Jet</SelectItem>
                    <SelectItem value="Large Jet">Large Jet</SelectItem>
                    <SelectItem value="Ultra Long Range Jet">Ultra Long Range Jet</SelectItem>
                    <SelectItem value="Regional Jet">Regional Jet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter a description of the jet..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-sm font-medium">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="Enter a URL to an image of the jet..."
              />
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('template')}
                disabled={isSubmitting}
              >
                Back to Templates
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('interior')}
                disabled={isSubmitting}
              >
                Continue to Interior
              </Button>
            </div>
          </TabsContent>
          
          {/* INTERIOR DETAILS & LAYOUT */}
          <TabsContent value="interior" className="p-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interior_type" className="text-sm font-medium">Interior Type</Label>
                <Select
                  value={interiorData.interior_type}
                  onValueChange={(value) => handleInteriorSelectChange('interior_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interior type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seats" className="text-sm font-medium">Seats</Label>
                <div className="flex items-center">
                  <Sofa className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="seats"
                    name="seats"
                    type="number"
                    min="1"
                    max="30"
                    value={interiorData.seats}
                    onChange={handleInteriorChange}
                    placeholder="E.g., 8"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="berths" className="text-sm font-medium">Sleeper Berths</Label>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                  <BedDouble className="h-4 w-4 text-gray-500" />
                  <Switch
                    id="berths"
                    checked={interiorData.berths}
                    onCheckedChange={(checked) => handleBooleanChange('berths', checked)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="lavatory" className="text-sm font-medium">Lavatory</Label>
                <div className="flex-1"></div>
                <Switch
                  id="lavatory"
                  checked={interiorData.lavatory}
                  onCheckedChange={(checked) => handleBooleanChange('lavatory', checked)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="galley" className="text-sm font-medium">Galley</Label>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                  <Utensils className="h-4 w-4 text-gray-500" />
                  <Switch
                    id="galley"
                    checked={interiorData.galley}
                    onCheckedChange={(checked) => handleBooleanChange('galley', checked)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="wifi" className="text-sm font-medium">WiFi</Label>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-gray-500" />
                  <Switch
                    id="wifi"
                    checked={interiorData.wifi}
                    onCheckedChange={(checked) => handleBooleanChange('wifi', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="entertainment" className="text-sm font-medium">Entertainment</Label>
                <div className="flex items-center">
                  <Monitor className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="entertainment"
                    name="entertainment"
                    value={interiorData.entertainment}
                    onChange={handleInteriorChange}
                    placeholder="E.g., Satellite TV, Gaming Console"
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="interior_image_url" className="text-sm font-medium">Interior Image URL</Label>
                <Input
                  id="interior_image_url"
                  name="interior_image_url"
                  value={interiorData.interior_image_url}
                  onChange={handleInteriorChange}
                  placeholder="Enter a URL to an image of the interior..."
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes" className="text-sm font-medium">Interior Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={interiorData.notes}
                  onChange={handleInteriorChange}
                  placeholder="Any additional notes about the interior..."
                  rows={2}
                />
              </div>
            </div>
            
            {/* SEAT LAYOUT CONFIGURATION */}
            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Seat Layout Configuration
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="layoutRows" className="text-sm font-medium">Rows</Label>
                  <Input
                    id="layoutRows"
                    type="number"
                    min="1"
                    max="10"
                    value={layoutRows}
                    onChange={(e) => setLayoutRows(parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="layoutSeatsPerRow" className="text-sm font-medium">Seats Per Row</Label>
                  <Input
                    id="layoutSeatsPerRow"
                    type="number"
                    min="1"
                    max="8"
                    value={layoutSeatsPerRow}
                    onChange={(e) => setLayoutSeatsPerRow(parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                <p className="text-xs text-gray-500 mb-2">
                  Click on seats to mark them as excluded (for aisles, galleys, etc.)
                </p>
                <SeatLayoutConfigurator
                  rows={layoutRows}
                  seatsPerRow={layoutSeatsPerRow}
                  skipPositions={skipPositions}
                  onChange={handleSeatLayoutChange}
                />
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('details')}
                disabled={isSubmitting}
              >
                Back to Details
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Jet'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 