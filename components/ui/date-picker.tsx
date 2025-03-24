"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Client component props (non-serializable)
interface DatePickerClientProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

// Client implementation
function DatePickerClient({ date, setDate, className }: DatePickerClientProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            // Disable dates in the past
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Public component props (serializable)
export interface DatePickerProps {
  date: Date | undefined;
  onDateChange: string; // Serialized function
  className?: string;
}

// Public component with serializable props
export function DatePicker({ date, onDateChange, className }: DatePickerProps) {
  // Convert the serialized function to a callback
  const handleDateChange = (newDate: Date | undefined) => {
    const onChangeFn = new Function('date', onDateChange);
    onChangeFn(newDate);
  };
  
  return (
    <DatePickerClient
      date={date}
      setDate={handleDateChange}
      className={className}
    />
  );
} 