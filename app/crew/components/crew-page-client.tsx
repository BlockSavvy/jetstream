"use client";

import { useState, useEffect } from 'react';
import { CrewHero } from './crew-hero';
import { CrewListing } from './crew-listing';
import { CrewFilter } from '@/lib/types/crew.types';

export function CrewPageClient() {
  const [activeTab, setActiveTab] = useState<string>("crew");
  const [filters, setFilters] = useState<CrewFilter>({ isCaptain: false });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize filters on component mount and listen for events
  useEffect(() => {
    // Set initial filters based on the active tab
    setFilters(prevFilters => ({
      ...prevFilters,
      isCaptain: activeTab === 'captain'
    }));
    setIsInitialized(true);
    
    // Handle tab change events
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      console.log("Tab changed to:", tab);
      setActiveTab(tab);
      
      // Update the filters based on the selected tab
      setFilters(prev => ({
        ...prev,
        isCaptain: tab === 'captain',
        // Clear specializations when switching tabs
        specializations: []
      }));
    };
    
    // Handle filter change events
    const handleFilterChange = (event: CustomEvent) => {
      const { filters: newFilters } = event.detail;
      console.log("Filters changed:", newFilters);
      setFilters(newFilters);
    };
    
    // Handle filter reset events
    const handleFilterReset = () => {
      console.log("Filters reset");
      // Reset filters while preserving the current tab selection
      setFilters(activeTab === 'captain' ? { isCaptain: true } : { isCaptain: false });
    };
    
    // Add event listeners
    document.addEventListener('crew-tab-change', handleTabChange as EventListener);
    document.addEventListener('crew-filter-change', handleFilterChange as EventListener);
    document.addEventListener('crew-filter-reset', handleFilterReset as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('crew-tab-change', handleTabChange as EventListener);
      document.removeEventListener('crew-filter-change', handleFilterChange as EventListener);
      document.removeEventListener('crew-filter-reset', handleFilterReset as EventListener);
    };
  }, [activeTab]);
  
  if (!isInitialized) {
    return <div className="container py-4 text-center">Loading...</div>;
  }
  
  return (
    <div className="container max-w-full mx-auto py-4 px-4 space-y-6">
      <CrewHero activeTab={activeTab} />
      <CrewListing filters={filters} />
    </div>
  );
} 