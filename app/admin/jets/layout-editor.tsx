'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Check, RefreshCw, Save } from 'lucide-react';

type PresetLayout = {
  value: string;
  label: string;
};

type PresetCategory = {
  label: string;
  options: PresetLayout[];
};

type PresetLayouts = {
  [key: string]: PresetCategory;
};

type Jet = {
  id: string;
  model: string;
  manufacturer: string;
  capacity: number;
};

type SeatLayout = {
  rows: number;
  seatsPerRow: number;
  layoutType: string;
  totalSeats: number;
  seatMap?: {
    skipPositions?: number[][];
    customPositions?: { row: number; col: number; id: string }[];
  };
};

export default function JetLayoutEditor() {
  const [jets, setJets] = useState<Jet[]>([]);
  const [selectedJetId, setSelectedJetId] = useState<string>('');
  const [selectedJet, setSelectedJet] = useState<Jet | null>(null);
  const [currentLayout, setCurrentLayout] = useState<SeatLayout | null>(null);
  const [presetLayouts, setPresetLayouts] = useState<PresetLayouts | null>(null);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('');
  const [selectedPresetLayout, setSelectedPresetLayout] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load all jets
  useEffect(() => {
    async function loadJets() {
      try {
        const response = await fetch('/api/admin/jets');
        if (!response.ok) {
          throw new Error('Failed to load jets');
        }
        const data = await response.json();
        setJets(data.jets || []);
      } catch (error) {
        console.error('Error loading jets:', error);
        toast.error('Failed to load jets');
      }
    }

    loadJets();
  }, []);

  // Load preset layouts
  useEffect(() => {
    async function loadPresetLayouts() {
      try {
        const response = await fetch('/api/admin/jets/setLayout');
        if (!response.ok) {
          throw new Error('Failed to load preset layouts');
        }
        const data = await response.json();
        setPresetLayouts(data.presetLayouts || {});
      } catch (error) {
        console.error('Error loading preset layouts:', error);
        toast.error('Failed to load preset layouts');
      }
    }

    loadPresetLayouts();
  }, []);

  // Load current layout when a jet is selected
  useEffect(() => {
    if (!selectedJetId) {
      setCurrentLayout(null);
      setSelectedJet(null);
      return;
    }

    async function loadJetLayout() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/jets/${selectedJetId}`);
        if (!response.ok) {
          throw new Error('Failed to load jet layout');
        }
        const data = await response.json();
        setCurrentLayout(data.seatLayout || null);
        setSelectedJet(data.jet || null);
      } catch (error) {
        console.error('Error loading jet layout:', error);
        toast.error('Failed to load jet layout');
      } finally {
        setIsLoading(false);
      }
    }

    loadJetLayout();
  }, [selectedJetId]);

  // Generate layout from preset selection
  function generateLayoutFromPreset() {
    if (!selectedPresetLayout || !selectedJet) return;

    const [rows, cols] = selectedPresetLayout.split('x').map(Number);
    
    // Calculate total seats based on the preset
    const totalSeats = rows * cols;
    
    // If the total seats don't match the jet capacity, we'll adapt
    // The seat layout will display exactly the selected preset configuration
    
    const newLayout: SeatLayout = {
      rows,
      seatsPerRow: cols,
      layoutType: 'custom',
      totalSeats: Math.min(totalSeats, selectedJet.capacity || totalSeats),
      seatMap: {
        skipPositions: []
      }
    };
    
    // If the jet capacity is less than the total preset seats, 
    // add skipPositions for the extra seats
    if (selectedJet.capacity < totalSeats) {
      const extraSeats = totalSeats - selectedJet.capacity;
      for (let i = 0; i < extraSeats; i++) {
        const row = Math.floor((totalSeats - 1 - i) / cols);
        const col = (totalSeats - 1 - i) % cols;
        newLayout.seatMap!.skipPositions!.push([row, col]);
      }
    }
    
    setCurrentLayout(newLayout);
  }

  // Save the current layout to the database
  async function saveLayout() {
    if (!selectedJetId || !currentLayout) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/jets/setLayout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jetId: selectedJetId,
          layout: currentLayout
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save layout');
      }

      toast.success('Seat layout saved successfully');
      setIsSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Jet Seat Layout Editor</CardTitle>
        <CardDescription>Configure custom seating layouts for jets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Jet Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Jet</label>
          <Select
            value={selectedJetId}
            onValueChange={setSelectedJetId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a jet..." />
            </SelectTrigger>
            <SelectContent>
              {jets.map(jet => (
                <SelectItem key={jet.id} value={jet.id}>
                  {jet.manufacturer} {jet.model} ({jet.capacity} seats)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading jet configuration...</span>
          </div>
        ) : selectedJet && (
          <>
            {/* Current Layout Display */}
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Current Layout</h3>
              {currentLayout ? (
                <div className="space-y-1">
                  <p><span className="font-medium">Rows:</span> {currentLayout.rows}</p>
                  <p><span className="font-medium">Seats per row:</span> {currentLayout.seatsPerRow}</p>
                  <p><span className="font-medium">Total seats:</span> {currentLayout.totalSeats}</p>
                  <p><span className="font-medium">Layout type:</span> {currentLayout.layoutType}</p>
                  <p><span className="font-medium">Skipped positions:</span> {currentLayout.seatMap?.skipPositions?.length || 0}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No custom layout configured. Using auto-generated layout.</p>
              )}
            </div>

            {/* Layout Presets */}
            {presetLayouts && (
              <div className="space-y-4">
                <h3 className="font-medium">Configure New Layout</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Layout Style</label>
                  <Select
                    value={selectedPresetCategory}
                    onValueChange={setSelectedPresetCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose layout style..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(presetLayouts).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPresetCategory && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seat Configuration</label>
                    <Select
                      value={selectedPresetLayout}
                      onValueChange={setSelectedPresetLayout}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose seat configuration..." />
                      </SelectTrigger>
                      <SelectContent>
                        {presetLayouts[selectedPresetCategory].options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPresetLayout && (
                  <Button 
                    onClick={generateLayoutFromPreset}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Layout Preview
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          onClick={saveLayout}
          disabled={!selectedJetId || !currentLayout || isSaving || isLoading}
          className="ml-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Layout
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 