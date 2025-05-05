'use client';

import { useState } from 'react';
import { 
  Users, Map, Plane, ThermometerSun, CalendarIcon, 
  Wifi, Bed, Bath, Utensils, Tv, 
  ArrowDownUp, Ruler, Globe, Gauge, Crown
} from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

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
  };
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const JetDetailsTabs = ({ jetData, selectedTab, onTabChange }: JetDetailsTabsProps) => {
  const { getThemeClasses } = useGdyupTheme();

  // Define a consistent style for info items
  const renderInfoItem = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex items-center gap-4">
      <div className={getThemeClasses({
        base: "flex items-center justify-center rounded-full p-2.5 w-11 h-11 shadow-sm",
        default: "bg-[#DAFF0D]/20 text-[#DAFF0D]",
        blue: "bg-blue-500/20 text-blue-400",
        pink: "bg-pink-500/20 text-pink-400"
      })}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={getThemeClasses({
          base: "text-xs uppercase tracking-wide font-medium mb-0.5",
          default: "text-gray-400",
          blue: "text-blue-300/70",
          pink: "text-pink-300/70"
        })}>
          {label}
        </span>
        <span className={getThemeClasses({
          base: "font-semibold text-base",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>
          {value}
        </span>
      </div>
    </div>
  );

  // Render the specs tab content
  const renderSpecsTab = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 p-5">
      {jetData.capacity !== undefined && (
        renderInfoItem(
          <Users className="h-5 w-5" />,
          "Capacity",
          `${jetData.capacity || 'N/A'} seats`
        )
      )}
      
      {(jetData.range_nm !== undefined || true) && (
        renderInfoItem(
          <Map className="h-5 w-5" />,
          "Range",
          `${(jetData.range_nm || 0).toLocaleString()} nm`
        )
      )}
      
      {(jetData.cruise_speed_kts !== undefined || true) && (
        renderInfoItem(
          <Gauge className="h-5 w-5" />,
          "Cruise Speed",
          `${jetData.cruise_speed_kts || 'N/A'} kts`
        )
      )}
      
      {(jetData.max_altitude !== undefined || true) && (
        renderInfoItem(
          <ArrowDownUp className="h-5 w-5" />,
          "Max Altitude",
          `${(jetData.max_altitude || 0).toLocaleString() || "N/A"} ft`
        )
      )}
      
      {jetData.year !== undefined && (
        renderInfoItem(
          <CalendarIcon className="h-5 w-5" />,
          "Year",
          `${jetData.year || 'N/A'}`
        )
      )}
      
      {jetData.tail_number && (
        renderInfoItem(
          <Plane className="h-5 w-5" />,
          "Registration",
          jetData.tail_number
        )
      )}
    </div>
  );

  // Render the interior tab content
  const renderInteriorTab = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 p-5">
      {(jetData.interior_type || true) && (
        renderInfoItem(
          <Crown className="h-5 w-5" />,
          "Interior Type",
          jetData.interior_type || "Standard Executive"
        )
      )}
      
      {(jetData.cabin_width !== undefined || true) && (
        renderInfoItem(
          <Ruler className="h-5 w-5" />,
          "Cabin Width",
          `${jetData.cabin_width || 'N/A'} ft`
        )
      )}
      
      {(jetData.cabin_height !== undefined || true) && (
        renderInfoItem(
          <Ruler className="h-5 w-5 rotate-90" />,
          "Cabin Height",
          `${jetData.cabin_height || 'N/A'} ft`
        )
      )}
      
      {(jetData.cabin_length !== undefined || true) && (
        renderInfoItem(
          <Ruler className="h-5 w-5 -rotate-45" />,
          "Cabin Length",
          `${jetData.cabin_length || 'N/A'} ft`
        )
      )}
      
      {(jetData.berths !== undefined || true) && (
        renderInfoItem(
          <Bed className="h-5 w-5" />,
          "Sleeping Berths",
          jetData.berths ? "Available" : "Not Available"
        )
      )}
      
      {jetData.capacity !== undefined && (
        renderInfoItem(
          <Users className="h-5 w-5" />,
          "Passenger Capacity",
          `${jetData.capacity || 'N/A'} passengers`
        )
      )}
    </div>
  );

  // Render the amenities tab content
  const renderAmenitiesTab = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 p-5">
      {(jetData.wifi !== undefined || true) && (
        renderInfoItem(
          <Wifi className="h-5 w-5" />,
          "WiFi",
          jetData.wifi ? "Available" : "Not Available"
        )
      )}
      
      {(jetData.lavatory !== undefined || true) && (
        renderInfoItem(
          <Bath className="h-5 w-5" />,
          "Lavatory",
          jetData.lavatory ? "Available" : "Not Available"
        )
      )}
      
      {(jetData.galley !== undefined || true) && (
        renderInfoItem(
          <Utensils className="h-5 w-5" />,
          "Galley",
          jetData.galley ? "Available" : "Not Available"
        )
      )}
      
      {(jetData.entertainment || true) && (
        renderInfoItem(
          <Tv className="h-5 w-5" />,
          "Entertainment",
          jetData.entertainment || "Standard System"
        )
      )}
      
      {(jetData.berths !== undefined || true) && (
        renderInfoItem(
          <Bed className="h-5 w-5" />,
          "Sleeping Berths",
          jetData.berths ? "Available" : "Not Available"
        )
      )}
      
      {(jetData.range_nm !== undefined || true) && (
        renderInfoItem(
          <Globe className="h-5 w-5" />,
          "Flight Range",
          `${(jetData.range_nm || 0).toLocaleString()} nautical miles`
        )
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className="bg-black/40 rounded-xl p-1.5 mb-6 shadow-inner">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onTabChange('specs')}
            className={`py-3.5 rounded-lg text-center font-medium transition-all duration-300 ${
              selectedTab === 'specs'
                ? 'bg-[#DAFF0D] text-black shadow-md transform scale-102'
                : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white'
            }`}
          >
            Jet Specs
          </button>
          <button
            type="button"
            onClick={() => onTabChange('interior')}
            className={`py-3.5 rounded-lg text-center font-medium transition-all duration-300 ${
              selectedTab === 'interior'
                ? 'bg-[#DAFF0D] text-black shadow-md transform scale-102'
                : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white'
            }`}
          >
            Interior
          </button>
          <button
            type="button"
            onClick={() => onTabChange('amenities')}
            className={`py-3.5 rounded-lg text-center font-medium transition-all duration-300 ${
              selectedTab === 'amenities'
                ? 'bg-[#DAFF0D] text-black shadow-md transform scale-102'
                : 'bg-black/50 text-white/80 hover:bg-black/70 hover:text-white'
            }`}
          >
            Amenities
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className={getThemeClasses({
        base: "rounded-xl shadow-md border bg-gradient-to-b",
        default: "from-black to-gray-900/90 border-gray-800",
        blue: "from-black to-blue-950/90 border-blue-900",
        pink: "from-black to-pink-950/90 border-pink-900"
      })}>
        {selectedTab === 'specs' && renderSpecsTab()}
        {selectedTab === 'interior' && renderInteriorTab()}
        {selectedTab === 'amenities' && renderAmenitiesTab()}
      </div>
    </div>
  );
};

export default JetDetailsTabs; 