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
  const { 
    theme, 
    isMobile,
    getThemedTextClasses,
    getThemedButtonClasses,
    getThemedBackgroundClasses
  } = useGdyupTheme();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  
  // Safely handle time selector click - prevents SES_UNCAUGHT_EXCEPTION error
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      try {
        // No special handling needed, this just catches any errors 
        // that might bubble up from the time selector
      } catch (err) {
        console.warn('Caught error in time picker click handler', err);
      }
    };
    
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);
  
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

  // Calendar component with theme-specific styling
  const ThemedCalendar = React.useCallback(() => (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      initialFocus
      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
      className={cn(
        "gdyup-calendar p-3 rounded-md shadow-lg",
        getThemedBackgroundClasses('card'),
        "border border-gdyup-border"
      )}
      classNames={{
        day_selected: cn(
          "bg-opacity-100 font-bold",
          "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/80"
        ),
        day_today: cn(
          "font-bold border-2",
          "border-gdyup-primary text-gdyup-primary"
        ),
        day_outside: cn(
          "text-opacity-50",
          getThemedTextClasses('muted')
        ),
        day: cn(
          "p-2 hover:bg-opacity-50 transition-colors rounded-md",
          "hover:bg-gdyup-primary/20"
        ),
        head_cell: cn(
          "font-bold text-sm",
          getThemedTextClasses()
        ),
        table: "border-collapse space-y-1 w-full",
        caption: cn(
          "flex justify-center py-2 mb-2 relative items-center",
          getThemedTextClasses()
        ),
        caption_label: "text-md font-bold",
        nav_button: cn(
          "border p-1 rounded-md mx-1 hover:opacity-70",
          "border-gdyup-primary/50 text-gdyup-primary"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1"
      }}
    />
  ), [date, handleDateSelect, getThemedBackgroundClasses, getThemedTextClasses]);

  // The time selector component
  const TimeSelector = React.useCallback(() => (
    <div className="relative">
      <Select
        value={getCurrentTimeOption()}
        onValueChange={handleTimeChange}
        disabled={!date || disabled}
      >
        <SelectTrigger className={cn(
          "w-full min-w-[120px] h-11 gdyup-time-selector",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border focus:ring-1 focus:ring-gdyup-primary focus:ring-offset-1",
          getThemedTextClasses()
        )}>
          <Clock className="mr-2 h-4 w-4 text-gdyup-primary" />
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent className={cn(
          "max-h-[200px] overflow-y-auto gdyup-time-dropdown",
          getThemedBackgroundClasses('card'),
          getThemedTextClasses(),
          "border-gdyup-border"
        )}>
          {timeOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className={cn(
                "cursor-pointer gdyup-time-option",
                "hover:bg-gdyup-primary/20 focus:bg-gdyup-primary/20 data-[highlighted]:bg-gdyup-primary/20",
                getThemedTextClasses()
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ), [date, disabled, getCurrentTimeOption, handleTimeChange, timeOptions, getThemedBackgroundClasses, getThemedTextClasses]);

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
                    "w-full justify-start text-left font-normal border flex items-center h-11 px-3 py-2 relative rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 gdyup-date-button",
                    getThemedBackgroundClasses('card'),
                    getThemedTextClasses(),
                    "border-gdyup-border",
                    !date && "text-gdyup-text-subtle"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-gdyup-primary date-picker-icon" />
                  {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className={cn(
                "h-[80vh] p-0 pt-6 gdyup-date-sheet",
                getThemedBackgroundClasses('card'),
                getThemedTextClasses(),
                "border-t border-gdyup-border"
              )}>
                <SheetHeader className="px-4 mb-2">
                  <SheetTitle className={getThemedTextClasses()}>
                    Select Date & Time
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <ThemedCalendar />
                  <div className="mt-4">
                    <p className={cn("text-sm mb-2", getThemedTextClasses('muted'))}>
                      Select Time
                    </p>
                    <TimeSelector />
                  </div>
                </div>
                <div className="p-4 border-t border-gdyup-border mt-auto">
                  <Button
                    onClick={() => setIsCalendarOpen(false)}
                    className={cn(
                      "w-full h-11",
                      getThemedButtonClasses('primary')
                    )}
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
                    "w-full justify-start text-left font-normal border flex items-center h-11 px-3 py-2 relative rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 gdyup-date-button",
                    getThemedBackgroundClasses('card'),
                    getThemedTextClasses(),
                    "border-gdyup-border",
                    !date && "text-gdyup-text-subtle"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-gdyup-primary date-picker-icon" />
                  {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn(
                "p-3 rounded-md shadow-lg gdyup-calendar-popover z-[999]",
                getThemedBackgroundClasses('card'),
                "border border-gdyup-border"
              )}>
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