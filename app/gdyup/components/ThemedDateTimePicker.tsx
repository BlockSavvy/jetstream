'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion } from 'framer-motion';

// Define props interface for serialization
type DateChangeCallback = (date: Date | undefined) => void;

interface ThemedDateTimePickerProps {
  date: Date | undefined;
  setDate: DateChangeCallback;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Separate client component
const ThemedDateTimePickerClient = ({
  date,
  setDate,
  label = "Date and time",
  placeholder = "Select date and time",
  className,
  disabled = false,
}: ThemedDateTimePickerProps) => {
  const { theme, getThemeClasses, isMobile } = useGdyupTheme();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  
  // Function to update the time
  const handleTimeChange = (timeString: string) => {
    if (!date) return;
    
    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    setDate(newDate);
  };

  // Function to handle date selection - fix for serializable props
  const handleDateSelect = React.useCallback((newDate: Date | undefined) => {
    if (newDate) {
      // Preserve the time if we already have a date
      if (date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        newDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default to noon if setting date for the first time
        newDate.setHours(12, 0, 0, 0);
      }
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  }, [date, setDate]);

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const time = `${formattedHour}:${formattedMinute}`;
        const label = format(new Date().setHours(hour, minute), "h:mm a");
        options.push({ value: time, label });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Get the current time from the date (or default to 12:00)
  const getCurrentTimeOption = () => {
    if (!date) return "12:00";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 30) * 30;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${formattedMinutes}`;
  };

  // Get theme-specific button styles
  const getButtonStyles = () => {
    return getThemeClasses({
      base: "w-full justify-start text-left font-normal border flex items-center h-11 px-3 py-2 relative rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1",
      default: "border-white/30 bg-black hover:bg-gray-900 text-white",
      blue: "border-blue-500/40 bg-blue-950 hover:bg-blue-900 text-white",
      pink: "border-pink-500/40 bg-pink-950 hover:bg-pink-900 text-white"
    });
  };

  // Get theme-specific calendar styles
  const getCalendarStyles = () => {
    return getThemeClasses({
      base: "p-3 rounded-md shadow-lg",
      default: "bg-gray-900 text-white border border-white/30",
      blue: "bg-blue-950 text-white border border-blue-400/50",
      pink: "bg-pink-950 text-white border border-pink-400/50"
    });
  };

  // Calendar component with theme-specific styling
  const ThemedCalendar = React.useCallback(() => (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      initialFocus
      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
      className={getCalendarStyles()}
      classNames={{
        day_selected: getThemeClasses({
          base: "bg-opacity-100 font-bold",
          default: "bg-[#DAFF0D] text-black hover:bg-[#DAFF0D]/80",
          blue: "bg-blue-500 text-white hover:bg-blue-600",
          pink: "bg-pink-500 text-white hover:bg-pink-600"
        }),
        day_today: getThemeClasses({
          base: "font-bold border-2",
          default: "border-[#DAFF0D] text-[#DAFF0D]",
          blue: "border-blue-500 text-blue-300",
          pink: "border-pink-500 text-pink-300"
        }),
        day_outside: getThemeClasses({
          base: "text-opacity-50",
          default: "text-gray-500",
          blue: "text-blue-700",
          pink: "text-pink-700"
        }),
        day: getThemeClasses({
          base: "p-2 hover:bg-opacity-50 transition-colors rounded-md",
          default: "hover:bg-[#DAFF0D]/20",
          blue: "hover:bg-blue-500/20",
          pink: "hover:bg-pink-500/20"
        }),
        head_cell: getThemeClasses({
          base: "font-bold text-sm",
          default: "text-[#DAFF0D]",
          blue: "text-blue-400",
          pink: "text-pink-400"
        }),
        table: "border-collapse space-y-1 w-full",
        caption: getThemeClasses({
          base: "flex justify-center py-2 mb-2 relative items-center",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        }),
        caption_label: "text-md font-bold",
        nav_button: getThemeClasses({
          base: "border p-1 rounded-md mx-1 hover:opacity-70",
          default: "border-[#DAFF0D]/50 text-[#DAFF0D]",
          blue: "border-blue-400/50 text-blue-400",
          pink: "border-pink-400/50 text-pink-400"
        }),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1"
      }}
    />
  ), [date, handleDateSelect, getCalendarStyles, getThemeClasses]);

  // The time selector component
  const TimeSelector = React.useCallback(() => (
    <div className="relative">
      <Select
        value={getCurrentTimeOption()}
        onValueChange={handleTimeChange}
        disabled={!date || disabled}
      >
        <SelectTrigger className={getThemeClasses({
          base: "w-full min-w-[120px] h-11",
          default: "border-white/20 bg-black/80 text-white focus:ring-1 focus:ring-[#DAFF0D] focus:ring-offset-1",
          blue: "border-blue-500/30 bg-blue-950/80 text-white focus:ring-1 focus:ring-blue-500 focus:ring-offset-1",
          pink: "border-pink-500/30 bg-pink-950/80 text-white focus:ring-1 focus:ring-pink-500 focus:ring-offset-1"
        })}>
          <Clock className="mr-2 h-4 w-4 text-[#DAFF0D]" style={{ color: '#000000', stroke: '#000000', strokeWidth: 2 }} />
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent className={getThemeClasses({
          base: "max-h-[200px] overflow-y-auto",
          default: "bg-gray-900 text-white border-white/20",
          blue: "bg-blue-950 text-white border-blue-500/30",
          pink: "bg-pink-950 text-white border-pink-500/30"
        })}>
          {timeOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className={getThemeClasses({
                base: "cursor-pointer",
                default: "hover:bg-[#DAFF0D]/20 focus:bg-[#DAFF0D]/20 data-[highlighted]:bg-[#DAFF0D]/20 data-[highlighted]:text-white",
                blue: "hover:bg-blue-500/20 focus:bg-blue-500/20 data-[highlighted]:bg-blue-500/20 data-[highlighted]:text-white",
                pink: "hover:bg-pink-500/20 focus:bg-pink-500/20 data-[highlighted]:bg-pink-500/20 data-[highlighted]:text-white"
              })}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ), [date, disabled, getCurrentTimeOption, handleTimeChange, timeOptions, getThemeClasses]);

  return (
    <div className={cn("grid gap-2", className)}>
      {isMobile ? (
        // Mobile view with sheet modal
        <div className="flex gap-2 w-full">
          {/* Display date selection button */}
          <div className="flex-1">
            <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    getButtonStyles(),
                    !date && "text-gray-400"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-[#DAFF0D]" style={{ color: '#000000', stroke: '#000000', strokeWidth: 2 }} />
                  {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className={getThemeClasses({
                base: "h-[80vh] p-0 pt-6",
                default: "bg-gray-900 text-white border-t border-white/20",
                blue: "bg-blue-950 text-white border-t border-blue-500/30",
                pink: "bg-pink-950 text-white border-t border-pink-500/30"
              })}>
                <SheetHeader className="px-4 mb-2">
                  <SheetTitle className={getThemeClasses({
                    base: "text-lg font-bold",
                    default: "text-white",
                    blue: "text-white",
                    pink: "text-white"
                  })}>
                    Select Date & Time
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <ThemedCalendar />
                  <div className="mt-4">
                    <p className={getThemeClasses({
                      base: "text-sm mb-2",
                      default: "text-white/80",
                      blue: "text-blue-200/80",
                      pink: "text-pink-200/80"
                    })}>Select Time</p>
                    <TimeSelector />
                  </div>
                </div>
                <div className="p-4 border-t border-gray-800 mt-auto">
                  <Button
                    onClick={() => setIsCalendarOpen(false)}
                    className={getThemeClasses({
                      base: "w-full h-11",
                      default: "bg-[#DAFF0D] text-black hover:bg-[#DAFF0D]/80",
                      blue: "bg-blue-500 text-white hover:bg-blue-600",
                      pink: "bg-pink-500 text-white hover:bg-pink-600"
                    })}
                  >
                    Confirm
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Time selector for mobile */}
          {date && (
            <div className="w-40">
              <TimeSelector />
            </div>
          )}
        </div>
      ) : (
        // Desktop view with popover
        <div className="flex gap-2">
          {/* Date selector */}
          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    getButtonStyles(),
                    !date && "text-gray-400"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-[#DAFF0D]" style={{ color: '#000000', stroke: '#000000', strokeWidth: 2 }} />
                  {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={getCalendarStyles()}>
                <div className="flex flex-col space-y-4 p-2">
                  <ThemedCalendar />
                  <div className="flex justify-center">
                    <TimeSelector />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Time display for desktop */}
          {date && (
            <div className="w-40">
              <TimeSelector />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Define the exportable component
export function ThemedDateTimePicker(props: ThemedDateTimePickerProps) {
  return <ThemedDateTimePickerClient {...props} />;
}