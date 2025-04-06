'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimePickerDemoProps {
  date: Date;
  onChange?: (date: Date) => void;
}

export default function TimePickerDemo({ date, onChange }: TimePickerDemoProps) {
  // Handle the case where date is undefined
  const selectedDate = date || new Date();
  
  // Create a safe wrapper for the setDate function
  const setDate = React.useCallback(
    (newDate: Date) => {
      if (onChange) {
        onChange(newDate);
      }
    },
    [onChange]
  );
  
  // Generate hour options (12-hour format)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];
  
  const currentHour = format(selectedDate, 'h');
  const currentMinute = format(selectedDate, 'mm');
  const currentPeriod = format(selectedDate, 'a');
  
  // Set hour handler
  const handleHourChange = (value: string) => {
    const newDate = new Date(selectedDate);
    let newHour = parseInt(value, 10);
    
    // Convert to 24-hour
    if (currentPeriod === 'PM' && newHour < 12) {
      newHour += 12;
    } else if (currentPeriod === 'AM' && newHour === 12) {
      newHour = 0;
    }
    
    newDate.setHours(newHour);
    setDate(newDate);
  };
  
  // Set minute handler
  const handleMinuteChange = (value: string) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(parseInt(value, 10));
    setDate(newDate);
  };
  
  // Set AM/PM handler
  const handlePeriodChange = (value: string) => {
    const newDate = new Date(selectedDate);
    let hours = newDate.getHours();
    
    if (value === 'PM' && hours < 12) {
      // Convert to PM
      newDate.setHours(hours + 12);
    } else if (value === 'AM' && hours >= 12) {
      // Convert to AM
      newDate.setHours(hours - 12);
    }
    
    setDate(newDate);
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="time" className="text-xs font-medium">
        Set Time
      </Label>
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 opacity-50" />
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={currentHour}
            onValueChange={handleHourChange}
          >
            <SelectTrigger
              id="hours"
              className="w-[65px]"
              aria-label="Hours"
            >
              <SelectValue placeholder={currentHour} />
            </SelectTrigger>
            <SelectContent position="popper">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={currentMinute}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger
              id="minutes"
              className="w-[65px]"
              aria-label="Minutes"
            >
              <SelectValue placeholder={currentMinute} />
            </SelectTrigger>
            <SelectContent position="popper">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={currentPeriod}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger
              id="period"
              className="w-[65px]"
              aria-label="Period"
            >
              <SelectValue placeholder={currentPeriod} />
            </SelectTrigger>
            <SelectContent position="popper">
              {periods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 