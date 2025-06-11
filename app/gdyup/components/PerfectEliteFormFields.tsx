'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Clock, Users, Plane, Search, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { UltraEliteDateTimePicker } from './UltraEliteDateTimePicker';

// Enhanced Field Container with premium styling
interface EliteFieldContainerProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

function EliteFieldContainer({ children, className, error, label, required }: EliteFieldContainerProps) {
  const { getThemedTextClasses } = useGdyupTheme();
  
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className={cn(
          "text-sm font-semibold tracking-wide block",
          getThemedTextClasses(),
          error && "text-red-400"
        )}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute -bottom-6 left-0 right-0"
            >
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Perfect Location Field with enhanced autocomplete
interface PerfectLocationFieldProps {
  label: string;
  value: string;
  placeholder: string;
  icon?: React.ElementType;
  airports?: any[];
  error?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  variant?: 'departure' | 'arrival';
}

export function PerfectLocationField({
  label,
  value,
  placeholder,
  icon: Icon = MapPin,
  airports = [],
  error,
  className,
  onValueChange,
  variant = 'departure'
}: PerfectLocationFieldProps) {
  const { getThemedTextClasses } = useGdyupTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [filteredAirports, setFilteredAirports] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter airports based on search query
  useEffect(() => {
    if (searchQuery.length > 1 && airports.length > 0) {
      const filtered = airports
        .filter(airport => {
          const query = searchQuery.toLowerCase();
          return (
            airport.code?.toLowerCase().includes(query) ||
            airport.name?.toLowerCase().includes(query) ||
            airport.city?.toLowerCase().includes(query)
          );
        })
        .slice(0, 8); // Limit results for better UX
      
      setFilteredAirports(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredAirports([]);
      setIsOpen(false);
    }
  }, [searchQuery, airports]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onValueChange?.(newValue);
    setHighlightedIndex(-1);
  };

  const handleSelectAirport = (airport: any) => {
    const selectedValue = `${airport.city} (${airport.code})`;
    setSearchQuery(selectedValue);
    onValueChange?.(selectedValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredAirports.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredAirports.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredAirports[highlightedIndex]) {
          handleSelectAirport(filteredAirports[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <EliteFieldContainer label={label} error={error} className={className}>
      <div className="relative">
        {/* Elite Input Field */}
        <motion.div
          className={cn(
            "relative w-full h-18 rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-gdyup-bg-card/90 via-gdyup-bg-card/80 to-gdyup-bg-card/70",
            "backdrop-blur-xl border-2 border-gdyup-border/40",
            "shadow-xl shadow-black/10",
            "hover:border-gdyup-primary/50 hover:shadow-xl hover:shadow-gdyup-primary/10",
            "focus-within:border-gdyup-primary focus-within:shadow-xl focus-within:shadow-gdyup-primary/20",
            "transition-all duration-300 group"
          )}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.999 }}
        >
          {/* Background shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gdyup-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="relative z-10 flex items-center h-full px-5">
            {/* Icon */}
            <div className="flex-shrink-0 p-3 rounded-xl bg-gdyup-primary/20 border border-gdyup-primary/30 mr-4">
              <Icon className="h-6 w-6 text-gdyup-primary" />
            </div>
            
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length > 1 && setIsOpen(filteredAirports.length > 0)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder={placeholder}
              className={cn(
                "flex-1 bg-transparent border-none outline-none",
                "text-lg font-semibold placeholder:text-gdyup-text/50",
                getThemedTextClasses()
              )}
            />
            
            {/* Search indicator */}
            <motion.div
              className="flex-shrink-0 ml-2"
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gdyup-text/60" />
            </motion.div>
          </div>
          
          {/* Status indicator */}
          {value && !error && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-2 right-2 p-1 rounded-full bg-gdyup-primary/20"
            >
              <CheckCircle2 className="h-4 w-4 text-gdyup-primary" />
            </motion.div>
          )}
        </motion.div>

        {/* Elite Dropdown */}
        <AnimatePresence>
          {isOpen && filteredAirports.length > 0 && (
            <motion.div
              ref={listRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute top-full left-0 right-0 mt-2 z-50",
                "max-h-64 overflow-y-auto",
                "rounded-2xl border-2 border-gdyup-border/40",
                "bg-gradient-to-b from-gdyup-bg-dark/98 to-gdyup-bg-card/95",
                "backdrop-blur-2xl shadow-2xl shadow-black/20"
              )}
            >
              {filteredAirports.map((airport, index) => (
                <motion.button
                  key={airport.code}
                  onClick={() => handleSelectAirport(airport)}
                  className={cn(
                    "w-full p-4 text-left border-b border-gdyup-border/20 last:border-b-0",
                    "hover:bg-gdyup-primary/10 transition-colors duration-200",
                    "focus:outline-none focus:bg-gdyup-primary/10",
                    highlightedIndex === index && "bg-gdyup-primary/15",
                    getThemedTextClasses()
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{airport.city}</div>
                      <div className="text-sm opacity-70">{airport.name}</div>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 rounded-lg bg-gdyup-primary/20 text-gdyup-primary text-sm font-bold">
                      {airport.code}
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </EliteFieldContainer>
  );
}

// Perfect Date/Time Field wrapper
interface PerfectDateTimeFieldProps {
  label: string;
  value: Date | undefined;
  placeholder?: string;
  error?: string;
  className?: string;
  onValueChange?: (date: Date | undefined) => void;
}

export function PerfectDateTimeField({
  label,
  value,
  placeholder = "Select date and time",
  error,
  className,
  onValueChange
}: PerfectDateTimeFieldProps) {
  return (
    <EliteFieldContainer label={label} error={error} className={className}>
      <UltraEliteDateTimePicker
        date={value}
        setDate={onValueChange || (() => {})}
        placeholder={placeholder}
        label=""
      />
    </EliteFieldContainer>
  );
}

// Perfect Passenger Field
interface PerfectPassengerFieldProps {
  label: string;
  totalSeats: number;
  availableSeats: number;
  error?: string;
  className?: string;
  onTotalSeatsChange?: (seats: number) => void;
  onAvailableSeatsChange?: (seats: number) => void;
}

export function PerfectPassengerField({
  label,
  totalSeats,
  availableSeats,
  error,
  className,
  onTotalSeatsChange,
  onAvailableSeatsChange
}: PerfectPassengerFieldProps) {
  const { getThemedTextClasses } = useGdyupTheme();
  
  const yourSeats = totalSeats - availableSeats;
  const sharePercentage = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0;

  return (
    <EliteFieldContainer label={label} error={error} className={className}>
      <motion.div
        className={cn(
          "relative w-full p-6 rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-gdyup-bg-card/90 via-gdyup-bg-card/80 to-gdyup-bg-card/70",
          "backdrop-blur-xl border-2 border-gdyup-border/40",
          "shadow-xl shadow-black/10"
        )}
        whileHover={{ y: -2 }}
      >
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gdyup-primary/5 via-transparent to-gdyup-primary/5" />
        
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gdyup-primary/20 border border-gdyup-primary/30">
              <Users className="h-6 w-6 text-gdyup-primary" />
            </div>
            <div>
              <h3 className={cn("text-lg font-bold", getThemedTextClasses())}>
                Seat Configuration
              </h3>
              <p className={cn("text-sm opacity-70", getThemedTextClasses('muted'))}>
                Configure your seat sharing
              </p>
            </div>
          </div>

          {/* Seat Controls */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Seats */}
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold", getThemedTextClasses())}>
                Total Seats
              </label>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => onTotalSeatsChange?.(Math.max(1, totalSeats - 1))}
                  className="w-10 h-10 rounded-xl bg-gdyup-bg-card/50 border border-gdyup-border/40 hover:border-gdyup-primary/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  -
                </motion.button>
                <div className={cn(
                  "flex-1 h-10 rounded-xl bg-gdyup-bg-card/30 border border-gdyup-border/30",
                  "flex items-center justify-center font-bold",
                  getThemedTextClasses()
                )}>
                  {totalSeats}
                </div>
                <motion.button
                  onClick={() => onTotalSeatsChange?.(Math.min(20, totalSeats + 1))}
                  className="w-10 h-10 rounded-xl bg-gdyup-bg-card/50 border border-gdyup-border/40 hover:border-gdyup-primary/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Available Seats */}
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold", getThemedTextClasses())}>
                Share Seats
              </label>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => onAvailableSeatsChange?.(Math.max(0, availableSeats - 1))}
                  className="w-10 h-10 rounded-xl bg-gdyup-bg-card/50 border border-gdyup-border/40 hover:border-gdyup-primary/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  -
                </motion.button>
                <div className={cn(
                  "flex-1 h-10 rounded-xl bg-gdyup-primary/20 border border-gdyup-primary/40",
                  "flex items-center justify-center font-bold text-gdyup-primary"
                )}>
                  {availableSeats}
                </div>
                <motion.button
                  onClick={() => onAvailableSeatsChange?.(Math.min(totalSeats, availableSeats + 1))}
                  className="w-10 h-10 rounded-xl bg-gdyup-bg-card/50 border border-gdyup-border/40 hover:border-gdyup-primary/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </div>
            </div>
          </div>

          {/* Visual Summary */}
          <div className="p-4 rounded-xl bg-gdyup-bg-card/30 border border-gdyup-border/30">
            <div className="flex items-center justify-between text-sm">
              <div className={getThemedTextClasses()}>
                <span className="opacity-70">Your seats:</span>
                <span className="font-bold ml-2">{yourSeats}</span>
              </div>
              <div className={getThemedTextClasses()}>
                <span className="opacity-70">Sharing:</span>
                <span className="font-bold ml-2 text-gdyup-primary">{sharePercentage}%</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-gdyup-bg-card/50 overflow-hidden">
              <motion.div
                className="h-full bg-gdyup-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${sharePercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </EliteFieldContainer>
  );
} 