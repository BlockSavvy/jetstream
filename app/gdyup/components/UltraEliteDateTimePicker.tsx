'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isToday, isTomorrow, addMonths, subMonths, startOfDay, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plane, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';

// Define props interface for serialization
type DateChangeCallback = (date: Date | undefined) => void;

interface UltraEliteDateTimePickerProps {
  date: Date | undefined;
  setDate: DateChangeCallback;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const timeSlots = [
  { value: '06:00', label: '6:00 AM', period: 'Dawn', description: 'Early departure' },
  { value: '07:00', label: '7:00 AM', period: 'Morning', description: 'Business hours' },
  { value: '08:00', label: '8:00 AM', period: 'Morning', description: 'Peak business' },
  { value: '09:00', label: '9:00 AM', period: 'Morning', description: 'Standard business' },
  { value: '10:00', label: '10:00 AM', period: 'Late Morning', description: 'Preferred time' },
  { value: '11:00', label: '11:00 AM', period: 'Late Morning', description: 'Popular choice' },
  { value: '12:00', label: '12:00 PM', period: 'Noon', description: 'Lunch departure' },
  { value: '13:00', label: '1:00 PM', period: 'Afternoon', description: 'Post-lunch' },
  { value: '14:00', label: '2:00 PM', period: 'Afternoon', description: 'Standard afternoon' },
  { value: '15:00', label: '3:00 PM', period: 'Afternoon', description: 'Late afternoon' },
  { value: '16:00', label: '4:00 PM', period: 'Late Afternoon', description: 'Business close' },
  { value: '17:00', label: '5:00 PM', period: 'Evening', description: 'End of day' },
  { value: '18:00', label: '6:00 PM', period: 'Evening', description: 'Dinner time' },
  { value: '19:00', label: '7:00 PM', period: 'Evening', description: 'Evening departure' },
  { value: '20:00', label: '8:00 PM', period: 'Night', description: 'Late evening' },
  { value: '21:00', label: '9:00 PM', period: 'Night', description: 'Night departure' },
  { value: '22:00', label: '10:00 PM', period: 'Late Night', description: 'Very late' },
];

const UltraEliteDateTimePickerClient = ({
  date,
  setDate,
  placeholder = "Select departure date & time",
  className,
  disabled = false,
  label = "Departure Date & Time"
}: UltraEliteDateTimePickerProps) => {
  const { getThemedTextClasses } = useGdyupTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');

  // Quick date selections
  const quickDates = useMemo(() => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const thisWeekend = addDays(startOfWeek(today), 6);
    const nextWeek = addWeeks(today, 1);
    
    return [
      { 
        label: 'Today', 
        date: today, 
        subtitle: format(today, 'MMM d'),
        description: 'Same day departure'
      },
      { 
        label: 'Tomorrow', 
        date: tomorrow, 
        subtitle: format(tomorrow, 'MMM d'),
        description: 'Next day departure'
      },
      { 
        label: 'This Weekend', 
        date: thisWeekend, 
        subtitle: format(thisWeekend, 'MMM d'),
        description: 'Weekend flight'
      },
      { 
        label: 'Next Week', 
        date: nextWeek, 
        subtitle: format(nextWeek, 'MMM d'),
        description: 'Following week'
      },
    ];
  }, []);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const firstDay = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const days = [];
    
    for (let i = 0; i < 42; i++) {
      const day = addDays(firstDay, i);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const isPast = day < startOfDay(new Date());
      
      days.push({
        date: day,
        isCurrentMonth,
        isPast,
        isToday: isToday(day),
        isTomorrow: isTomorrow(day),
        isSelected: date && isSameDay(day, date),
      });
    }
    
    return days;
  }, [currentMonth, date]);

  const calendarDays = generateCalendarDays();

  const handleDateSelect = (selectedDate: Date) => {
    let newDate = new Date(selectedDate);
    
    // If we have an existing date, preserve the time
    if (date) {
      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    } else {
      // Set default time based on selectedTime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      newDate = setHours(setMinutes(newDate, minutes), hours);
    }
    
    setDate(newDate);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = setHours(setMinutes(new Date(date), minutes), hours);
      setDate(newDate);
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    setIsOpen(false);
    setStep('date');
  };

  const formatDisplayDate = () => {
    if (!date) return placeholder;
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'EEE, MMM d • h:mm a');
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Ultra Elite Trigger Button */}
      <motion.button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full h-20 px-6 py-4 rounded-3xl",
          "bg-gradient-to-br from-gdyup-bg-card/90 via-gdyup-bg-card/80 to-gdyup-bg-card/70",
          "backdrop-blur-xl border-2 border-gdyup-border/40",
          "shadow-2xl shadow-black/20",
          "hover:border-gdyup-primary/60 hover:shadow-2xl hover:shadow-gdyup-primary/10",
          "focus:outline-none focus:border-gdyup-primary focus:shadow-2xl focus:shadow-gdyup-primary/20",
          "transition-all duration-500 ease-out",
          "group relative overflow-hidden",
          disabled && "opacity-50 cursor-not-allowed",
          getThemedTextClasses()
        )}
        whileHover={!disabled ? { y: -3, scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        {/* Background Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gdyup-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        <div className="relative z-10 flex items-center justify-between h-full">
          <div className="flex items-center gap-5">
            {/* Icon Container */}
            <div className={cn(
              "p-4 rounded-2xl relative",
              "bg-gradient-to-br from-gdyup-primary/20 to-gdyup-primary/10",
              "border border-gdyup-primary/30",
              "group-hover:from-gdyup-primary/30 group-hover:to-gdyup-primary/20",
              "transition-all duration-300"
            )}>
              <CalendarIcon className="h-7 w-7 text-gdyup-primary drop-shadow-sm" />
              
              {/* Icon shimmer */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </div>
            
            {/* Content */}
            <div className="text-left">
              <div className={cn(
                "text-sm font-semibold mb-1 opacity-80",
                getThemedTextClasses('muted')
              )}>
                {label}
              </div>
              <div className={cn(
                "text-lg font-bold leading-tight",
                getThemedTextClasses(),
                !date && "opacity-60"
              )}>
                {formatDisplayDate()}
              </div>
              {date && (
                <div className={cn(
                  "text-xs opacity-70 mt-1",
                  getThemedTextClasses('muted')
                )}>
                  {format(date, 'EEEE, MMMM do, yyyy')}
                </div>
              )}
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            {date && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gdyup-primary/20 border border-gdyup-primary/40"
              >
                <CheckCircle2 className="h-4 w-4 text-gdyup-primary" />
                <span className="text-sm font-bold text-gdyup-primary">Set</span>
              </motion.div>
            )}
            
            {/* Arrow indicator */}
            <motion.div
              className="opacity-40 group-hover:opacity-70 transition-opacity"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronRight className="h-5 w-5 text-gdyup-text" />
            </motion.div>
          </div>
        </div>
      </motion.button>

      {/* Ultra Elite Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Premium Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Ultra Elite Modal Content */}
            <motion.div
              className={cn(
                "fixed inset-x-4 top-1/2 -translate-y-1/2 z-[9999]",
                "max-w-lg mx-auto max-h-[85vh]",
                "rounded-3xl border-2 border-gdyup-border/40",
                "bg-gradient-to-b from-gdyup-bg-dark/98 via-gdyup-bg-card/95 to-gdyup-bg-dark/98",
                "backdrop-blur-2xl shadow-2xl shadow-black/40",
                "overflow-hidden"
              )}
              initial={{ opacity: 0, scale: 0.85, y: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.85, y: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Elite Header */}
              <div className="relative p-6 border-b border-gdyup-border/30">
                {/* Header Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-gdyup-primary/5 via-transparent to-gdyup-primary/5" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gdyup-primary/20 border border-gdyup-primary/30">
                        {step === 'date' ? (
                          <CalendarIcon className="h-6 w-6 text-gdyup-primary" />
                        ) : step === 'time' ? (
                          <Clock className="h-6 w-6 text-gdyup-primary" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-gdyup-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className={cn("text-xl font-bold", getThemedTextClasses())}>
                          {step === 'date' ? 'Select Date' : 
                           step === 'time' ? 'Choose Time' : 
                           'Confirm Flight'}
                        </h3>
                        <p className={cn("text-sm opacity-80", getThemedTextClasses('muted'))}>
                          {step === 'date' ? 'When do you want to depart?' : 
                           step === 'time' ? 'What time works best?' : 
                           'Perfect! Your flight is ready'}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => setIsOpen(false)}
                      className="p-3 rounded-xl hover:bg-gdyup-bg-card/50 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronRight className="h-5 w-5 text-gdyup-text rotate-45" />
                    </motion.button>
                  </div>

                  {/* Premium Step Indicator */}
                  <div className="flex items-center gap-2 mt-6">
                    {['date', 'time', 'confirm'].map((s, index) => {
                      const isActive = index <= ['date', 'time', 'confirm'].indexOf(step);
                      const isCurrent = s === step;
                      
                      return (
                        <motion.div
                          key={s}
                          className={cn(
                            "relative flex-1 h-2 rounded-full overflow-hidden",
                            isActive ? "bg-gdyup-primary/30" : "bg-gdyup-border/30"
                          )}
                          initial={false}
                          animate={{ 
                            backgroundColor: isActive ? "rgb(var(--gdyup-primary-rgb) / 0.3)" : "rgb(var(--gdyup-border-rgb) / 0.3)" 
                          }}
                        >
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 bg-gdyup-primary rounded-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: isCurrent ? 1 : 0.7 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              style={{ originX: 0 }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 'date' && (
                    <motion.div
                      key="date"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Quick Date Selection */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {quickDates.map((quick, index) => (
                          <motion.button
                            key={quick.label}
                            onClick={() => handleDateSelect(quick.date)}
                            className={cn(
                              "p-4 rounded-xl border border-gdyup-border/40",
                              "bg-gradient-to-br from-gdyup-bg-card/60 to-gdyup-bg-card/30",
                              "hover:border-gdyup-primary/50 hover:shadow-lg hover:shadow-gdyup-primary/10",
                              "transition-all duration-300",
                              "text-left group"
                            )}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={cn("font-bold text-sm mb-1", getThemedTextClasses())}>
                              {quick.label}
                            </div>
                            <div className={cn("text-xs opacity-70 mb-1", getThemedTextClasses('muted'))}>
                              {quick.subtitle}
                            </div>
                            <div className={cn("text-xs opacity-50", getThemedTextClasses('muted'))}>
                              {quick.description}
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Elite Calendar */}
                      <div className="space-y-4">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between">
                          <motion.button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-3 rounded-xl hover:bg-gdyup-bg-card/50 transition-colors"
                            whileHover={{ scale: 1.1, x: -2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ChevronLeft className="h-5 w-5 text-gdyup-text" />
                          </motion.button>
                          
                          <h4 className={cn("text-lg font-bold", getThemedTextClasses())}>
                            {format(currentMonth, 'MMMM yyyy')}
                          </h4>
                          
                          <motion.button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-3 rounded-xl hover:bg-gdyup-bg-card/50 transition-colors"
                            whileHover={{ scale: 1.1, x: 2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ChevronRight className="h-5 w-5 text-gdyup-text" />
                          </motion.button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {/* Day Headers */}
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className={cn(
                              "h-10 flex items-center justify-center text-xs font-bold",
                              getThemedTextClasses('muted')
                            )}>
                              {day}
                            </div>
                          ))}
                          
                          {/* Calendar Days */}
                          {calendarDays.map((day, index) => (
                            <motion.button
                              key={index}
                              onClick={() => !day.isPast && handleDateSelect(day.date)}
                              disabled={day.isPast}
                              className={cn(
                                "h-10 flex items-center justify-center rounded-xl text-sm font-semibold",
                                "transition-all duration-200 relative",
                                day.isPast && "opacity-30 cursor-not-allowed",
                                !day.isCurrentMonth && "opacity-50",
                                day.isToday && !day.isSelected && "bg-gdyup-primary/20 text-gdyup-primary border border-gdyup-primary/40",
                                day.isSelected && "bg-gdyup-primary text-gdyup-button-text shadow-lg shadow-gdyup-primary/30",
                                !day.isSelected && !day.isToday && !day.isPast && "hover:bg-gdyup-bg-card/70 hover:scale-110",
                                getThemedTextClasses()
                              )}
                              whileHover={!day.isPast ? { scale: 1.15 } : {}}
                              whileTap={!day.isPast ? { scale: 0.95 } : {}}
                            >
                              {day.date.getDate()}
                              
                              {/* Today indicator */}
                              {day.isToday && !day.isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 bg-gdyup-primary rounded-full" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'time' && (
                    <motion.div
                      key="time"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Time Slots by Period */}
                      <div className="space-y-4">
                        {['Dawn', 'Morning', 'Afternoon', 'Evening', 'Night'].map((period) => {
                          const periodSlots = timeSlots.filter(slot => 
                            slot.period === period || 
                            (period === 'Morning' && slot.period.includes('Morning')) ||
                            (period === 'Afternoon' && slot.period.includes('Afternoon')) ||
                            (period === 'Evening' && slot.period.includes('Evening')) ||
                            (period === 'Night' && slot.period.includes('Night'))
                          );
                          
                          if (periodSlots.length === 0) return null;

                          return (
                            <div key={period} className="space-y-3">
                              <div className="flex items-center gap-3">
                                <h5 className={cn("text-sm font-bold", getThemedTextClasses())}>
                                  {period}
                                </h5>
                                <div className="flex-1 h-px bg-gdyup-border/30" />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                {periodSlots.map((slot, index) => {
                                  const isSelected = selectedTime === slot.value || 
                                    (date && format(date, 'HH:mm') === slot.value);
                                  
                                  return (
                                    <motion.button
                                      key={slot.value}
                                      onClick={() => handleTimeSelect(slot.value)}
                                      className={cn(
                                        "p-3 rounded-xl border transition-all duration-200 text-left",
                                        isSelected
                                          ? "border-gdyup-primary bg-gdyup-primary/20 text-gdyup-primary shadow-lg shadow-gdyup-primary/20"
                                          : "border-gdyup-border/40 bg-gdyup-bg-card/40 hover:border-gdyup-primary/60 hover:bg-gdyup-bg-card/60",
                                        getThemedTextClasses()
                                      )}
                                      whileHover={{ scale: 1.05, y: -2 }}
                                      whileTap={{ scale: 0.95 }}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                    >
                                      <div className="text-sm font-bold">
                                        {slot.label}
                                      </div>
                                      <div className={cn("text-xs opacity-70", getThemedTextClasses('muted'))}>
                                        {slot.description}
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {step === 'confirm' && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3 }}
                      className="text-center space-y-6"
                    >
                      {/* Success Animation */}
                      <motion.div
                        className="p-8 rounded-2xl bg-gradient-to-br from-gdyup-primary/20 via-gdyup-primary/10 to-gdyup-primary/5 border border-gdyup-primary/30"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 20 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: "spring", damping: 15 }}
                        >
                          <CheckCircle2 className="h-16 w-16 text-gdyup-primary mx-auto mb-4" />
                        </motion.div>
                        
                        <motion.h4 
                          className={cn("text-2xl font-bold mb-3", getThemedTextClasses())}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          Perfect Flight Time!
                        </motion.h4>
                        
                        <motion.p 
                          className={cn("text-lg font-semibold", getThemedTextClasses())}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                        >
                          {formatDisplayDate()}
                        </motion.p>
                        
                        <motion.p 
                          className={cn("text-sm opacity-80 mt-3", getThemedTextClasses('muted'))}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 }}
                        >
                          {date && format(date, 'EEEE, MMMM do, yyyy')}
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Elite Footer Actions */}
              <div className="p-6 border-t border-gdyup-border/30 bg-gradient-to-r from-gdyup-bg-card/20 to-gdyup-bg-card/10">
                <div className="flex gap-3">
                  {step !== 'date' && (
                    <motion.button
                      onClick={() => setStep(step === 'time' ? 'date' : 'time')}
                      className={cn(
                        "flex-1 py-4 px-6 rounded-2xl border border-gdyup-border/40",
                        "bg-gdyup-bg-card/40 hover:bg-gdyup-bg-card/60",
                        "font-semibold transition-all duration-200",
                        getThemedTextClasses()
                      )}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ← Back
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={step === 'confirm' ? handleConfirm : () => {
                      if (step === 'date' && date) setStep('time');
                      else if (step === 'time') setStep('confirm');
                    }}
                    disabled={step === 'date' && !date}
                    className={cn(
                      "flex-1 py-4 px-6 rounded-2xl font-bold",
                      "bg-gradient-to-r from-gdyup-primary to-gdyup-primary/90",
                      "text-gdyup-button-text shadow-lg shadow-gdyup-primary/30",
                      "hover:shadow-xl hover:shadow-gdyup-primary/40 hover:scale-105",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                      "transition-all duration-200"
                    )}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {step === 'confirm' ? '✈️ Set Flight Time' : 'Continue →'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Export the main component
export function UltraEliteDateTimePicker(props: UltraEliteDateTimePickerProps) {
  return <UltraEliteDateTimePickerClient {...props} />;
} 