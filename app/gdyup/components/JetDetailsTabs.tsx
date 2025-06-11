'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Map, Plane, ThermometerSun, CalendarIcon, 
  Wifi, Bed, Bath, Utensils, Tv, 
  ArrowDownUp, Ruler, Globe, Gauge, Crown, ArrowUp, Calendar, Home
} from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

interface JetDetailsTabsProps {
  jetData: {
    id: string;
    manufacturer?: string;
    model?: string;
    tail_number?: string;
    year?: number;
    range_nm?: number;
    cruise_speed_kts?: number;
    max_altitude?: number;
    cabin_width?: number;
    cabin_height?: number;
    cabin_length?: number;
    capacity?: number;
    // Interior specific fields
    berths?: boolean;
    lavatory?: boolean;
    galley?: boolean;
    entertainment?: string;
    wifi?: boolean;
    interior_type?: string;
    home_base_airport?: string;
  };
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const JetDetailsTabs = ({ jetData, selectedTab, onTabChange }: JetDetailsTabsProps) => {
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();

  // Debug jet data more thoroughly
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('JetDetailsTabs received data:', {
        id: jetData?.id,
        manufacturer: jetData?.manufacturer,
        model: jetData?.model,
        tail_number: jetData?.tail_number,
        capacity: jetData?.capacity,
        year: jetData?.year,
        range_nm: jetData?.range_nm,
        has_interior_data: !!(jetData?.berths !== undefined || jetData?.lavatory !== undefined)
      });
    }
  }, [jetData]);

  // Define a consistent style for info items
  const renderInfoItem = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className={cn(
      "flex items-center gap-4 bg-black/30 rounded-lg p-3 hover:bg-black/40 transition-colors border border-gdyup-border/30",
      "hover:border-gdyup-primary/20"
    )}>
      <div className={cn(
        "flex items-center justify-center rounded-full p-2.5 w-11 h-11 shadow-md",
        "bg-gdyup-primary/20 text-gdyup-primary"
      )}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-xs uppercase tracking-wide font-medium mb-0.5", getThemedTextClasses('muted'))}>
          {label}
        </span>
        <span className={cn("font-semibold text-base", getThemedTextClasses())}>
          {value}
        </span>
      </div>
    </div>
  );

  // Helper to render a section title
  const renderSectionTitle = (title: string) => (
    <div className="col-span-full mb-2 mt-1">
      <h3 className={cn("text-sm font-medium border-b border-gdyup-border/30 pb-1",
        getThemedTextClasses('secondary')
      )}>
        {title}
      </h3>
    </div>
  );

  // Render the specs tab content
  const renderSpecsTab = () => {
    // Debug log the available data
    if (process.env.NODE_ENV === 'development') {
      console.log('JetDetailsTabs rendering with data:', 
        jetData ? {
          id: jetData.id,
          manufacturer: jetData.manufacturer,
          model: jetData.model,
          capacity: jetData.capacity,
          tail_number: jetData.tail_number
        } : 'No jet data available'
      );
    }
    
    // Check if we have valid jet data
    if (!jetData || !jetData.id) {
      return (
        <div className="p-5 text-center">
          <span className={cn("italic", getThemedTextClasses('muted'))}>
            Jet data is not available
          </span>
        </div>
      );
    }
    
    return (
      <div className="p-5 space-y-4">
        {/* Aircraft Overview Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSectionTitle("Aircraft Overview")}
          
          {/* Registration & Year */}
          <div className="flex flex-col space-y-3">
            {jetData?.capacity !== undefined && renderInfoItem(
              <Users className="h-5 w-5" />,
              "Capacity",
              `${jetData.capacity} seats`
            )}
            
            {jetData?.tail_number && renderInfoItem(
              <Plane className="h-5 w-5" />,
              "Registration",
              jetData.tail_number
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            {jetData?.year !== undefined && renderInfoItem(
              <Calendar className="h-5 w-5" />,
              "Year",
              `${jetData.year || 'N/A'}`
            )}
            
            {jetData?.home_base_airport && renderInfoItem(
              <Home className="h-5 w-5" />,
              "Home Base",
              jetData.home_base_airport
            )}
          </div>
        </div>
        
        {/* Performance Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSectionTitle("Performance")}
          
          <div className="flex flex-col space-y-3">
            {jetData?.range_nm !== undefined && renderInfoItem(
              <Map className="h-5 w-5" />,
              "Range",
              `${jetData.range_nm && typeof jetData.range_nm === 'number' ? jetData.range_nm.toLocaleString() : jetData.range_nm || 'N/A'} nm`
            )}
            
            {jetData?.max_altitude !== undefined && jetData.max_altitude && renderInfoItem(
              <ArrowUp className="h-5 w-5" />,
              "Max Altitude",
              `${typeof jetData.max_altitude === 'number' ? jetData.max_altitude.toLocaleString() : jetData.max_altitude} ft`
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            {jetData?.cruise_speed_kts !== undefined && renderInfoItem(
              <Gauge className="h-5 w-5" />,
              "Cruise Speed",
              `${jetData.cruise_speed_kts && typeof jetData.cruise_speed_kts === 'number' ? jetData.cruise_speed_kts.toLocaleString() : jetData.cruise_speed_kts || 'N/A'} kts`
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the interior tab content
  const renderInteriorTab = () => {
    // Check if we have valid jet data
    if (!jetData || !jetData.id) {
      return (
        <div className="p-5 text-center">
          <span className={cn("italic", getThemedTextClasses('muted'))}>
            Interior data is not available
          </span>
        </div>
      );
    }
    
    return (
      <div className="p-5 space-y-4">
        {/* Cabin Overview Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSectionTitle("Cabin Overview")}
          
          <div className="flex flex-col space-y-3">
            {jetData.interior_type && renderInfoItem(
              <Crown className="h-5 w-5" />,
              "Interior Type",
              jetData.interior_type
            )}
            
            {jetData.capacity !== undefined && renderInfoItem(
              <Users className="h-5 w-5" />,
              "Passenger Capacity",
              `${jetData.capacity} passengers`
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            {jetData.berths !== undefined && renderInfoItem(
              <Bed className="h-5 w-5" />,
              "Sleeping Berths",
              jetData.berths ? "Available" : "Not Available"
            )}
          </div>
        </div>
        
        {/* Cabin Dimensions Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSectionTitle("Cabin Dimensions")}
          
          <div className="flex flex-col space-y-3">
            {jetData.cabin_width !== undefined && renderInfoItem(
              <Ruler className="h-5 w-5" />,
              "Cabin Width",
              `${jetData.cabin_width || 'N/A'} in`
            )}
            
            {jetData.cabin_height !== undefined && renderInfoItem(
              <Ruler className="h-5 w-5 rotate-90" />,
              "Cabin Height",
              `${jetData.cabin_height || 'N/A'} in`
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            {jetData.cabin_length !== undefined && renderInfoItem(
              <Ruler className="h-5 w-5 -rotate-45" />,
              "Cabin Length",
              `${jetData.cabin_length || 'N/A'} in`
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the amenities tab content
  const renderAmenitiesTab = () => {
    // Check if we have valid jet data
    if (!jetData || !jetData.id) {
      return (
        <div className="p-5 text-center">
          <span className={cn("italic", getThemedTextClasses('muted'))}>
            Amenities data is not available
          </span>
        </div>
      );
    }
    
    return (
      <div className="p-5 space-y-4">
        {/* Connectivity Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSectionTitle("Connectivity & Entertainment")}
          
          <div className="flex flex-col space-y-3">
            {jetData.wifi !== undefined && renderInfoItem(
              <Wifi className="h-5 w-5" />,
              "WiFi",
              jetData.wifi ? "Available" : "Not Available"
            )}
            
            {jetData.entertainment && renderInfoItem(
              <Tv className="h-5 w-5" />,
              "Entertainment",
              jetData.entertainment
            )}
          </div>
        </div>
        
        {/* Comfort & Conveniences Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSectionTitle("Comfort & Conveniences")}
          
          <div className="flex flex-col space-y-3">
            {jetData.lavatory !== undefined && renderInfoItem(
              <Bath className="h-5 w-5" />,
              "Lavatory",
              jetData.lavatory ? "Available" : "Not Available"
            )}
            
            {jetData.berths !== undefined && renderInfoItem(
              <Bed className="h-5 w-5" />,
              "Sleeping Berths",
              jetData.berths ? "Available" : "Not Available"
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            {jetData.galley !== undefined && renderInfoItem(
              <Utensils className="h-5 w-5" />,
              "Galley",
              jetData.galley ? "Available" : "Not Available"
            )}
            
            {jetData.range_nm !== undefined && renderInfoItem(
              <Globe className="h-5 w-5" />,
              "Flight Range",
              `${jetData.range_nm && typeof jetData.range_nm === 'number' ? jetData.range_nm.toLocaleString() : jetData.range_nm || 'N/A'} nm`
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className="bg-black/40 rounded-xl p-1.5 mb-4 shadow-inner">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onTabChange('specs')}
            className={cn(
              "py-3.5 rounded-lg text-center font-medium transition-all duration-300",
              selectedTab === 'specs'
                ? "bg-gdyup-primary " + getThemedTextClasses('inverse') + " shadow-md transform scale-102" 
                : "bg-black/50 " + getThemedTextClasses() + " hover:bg-black/70"
            )}
          >
            Jet Specs
          </button>
          <button
            type="button"
            onClick={() => onTabChange('interior')}
            className={cn(
              "py-3.5 rounded-lg text-center font-medium transition-all duration-300",
              selectedTab === 'interior'
                ? "bg-gdyup-primary " + getThemedTextClasses('inverse') + " shadow-md transform scale-102" 
                : "bg-black/50 " + getThemedTextClasses() + " hover:bg-black/70"
            )}
          >
            Interior
          </button>
          <button
            type="button"
            onClick={() => onTabChange('amenities')}
            className={cn(
              "py-3.5 rounded-lg text-center font-medium transition-all duration-300",
              selectedTab === 'amenities'
                ? "bg-gdyup-primary " + getThemedTextClasses('inverse') + " shadow-md transform scale-102" 
                : "bg-black/50 " + getThemedTextClasses() + " hover:bg-black/70"
            )}
          >
            Amenities
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className={cn(
        "rounded-xl shadow-md border bg-gradient-to-b from-black to-gdyup-bg-dark",
        "border-gdyup-border"
      )}>
        {selectedTab === 'specs' && renderSpecsTab()}
        {selectedTab === 'interior' && renderInteriorTab()}
        {selectedTab === 'amenities' && renderAmenitiesTab()}
      </div>
    </div>
  );
};

export default JetDetailsTabs; 