'use client';

import * as React from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isToday, isTomorrow, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plane, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';

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

const timeSlots = [
  { value: '06:00', label: '6:00 AM', period: 'Early Morning' },
  { value: '07:00', label: '7:00 AM', period: 'Early Morning' },
  { value: '08:00', label: '8:00 AM', period: 'Morning' },
  { value: '09:00', label: '9:00 AM', period: 'Morning' },
  { value: '10:00', label: '10:00 AM', period: 'Morning' },
  { value: '11:00', label: '11:00 AM', period: 'Late Morning' },
  { value: '12:00', label: '12:00 PM', period: 'Noon' },
  { value: '13:00', label: '1:00 PM', period: 'Afternoon' },
  { value: '14:00', label: '2:00 PM', period: 'Afternoon' },
  { value: '15:00', label: '3:00 PM', period: 'Afternoon' },
  { value: '16:00', label: '4:00 PM', period: 'Late Afternoon' },
  { value: '17:00', label: '5:00 PM', period: 'Evening' },
  { value: '18:00', label: '6:00 PM', period: 'Evening' },
  { value: '19:00', label: '7:00 PM', period: 'Evening' },
  { value: '20:00', label: '8:00 PM', period: 'Night' },
  { value: '21:00', label: '9:00 PM', period: 'Night' },
  { value: '22:00', label: '10:00 PM', period: 'Late Night' },
];

// Separate client component
const ThemedDateTimePickerClient = ({
  date,
  setDate,
  label = "Date and time",
  placeholder = "Select departure date & time",
  className,
  disabled = false,
}: ThemedDateTimePickerProps) => {
  const { getThemedTextClasses } = useGdyupTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedTime, setSelectedTime] = React.useState('12:00');
  const [step, setStep] = React.useState<'date' | 'time' | 'confirm'>('date');

  // Quick date selections
  const quickDates = React.useMemo(() => {
    const today = new Date();
    return [
      { label: 'Today', date: today, subtitle: format(today, 'MMM d') },
      { label: 'Tomorrow', date: addDays(today, 1), subtitle: format(addDays(today, 1), 'MMM d') },
      { label: 'This Weekend', date: addDays(startOfWeek(today), 6), subtitle: 'Saturday' },
      { label: 'Next Week', date: addWeeks(today, 1), subtitle: format(addWeeks(today, 1), 'MMM d') },
    ];
  }, []);

  // Generate calendar days
  const generateCalendarDays = React.useCallback(() => {
    const firstDay = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const days = [];
    
    for (let i = 0; i < 42; i++) {
      const day = addDays(firstDay, i);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
      
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
    const newDate = new Date(selectedDate);
    if (date) {
      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    } else {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      newDate.setHours(hours, minutes, 0, 0);
    }
    setDate(newDate);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
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
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'EEE, MMM d • h:mm a');
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Elite Trigger Button */}
      <motion.button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full h-16 px-6 rounded-2xl border-2 border-gdyup-border/30",
          "bg-gradient-to-r from-gdyup-bg-card/80 to-gdyup-bg-card/60",
          "backdrop-blur-xl shadow-xl",
          "flex items-center justify-between",
          "hover:border-gdyup-primary/50 hover:shadow-2xl hover:shadow-gdyup-primary/10",
          "transition-all duration-300 ease-out",
          "focus:outline-none focus:border-gdyup-primary focus:shadow-2xl focus:shadow-gdyup-primary/20",
          disabled && "opacity-50 cursor-not-allowed",
          getThemedTextClasses()
        )}
        whileHover={!disabled ? { y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gdyup-primary/20">
            <CalendarIcon className="h-6 w-6 text-gdyup-primary" />
          </div>
          <div className="text-left">
            <div className={cn("text-sm font-medium opacity-70", getThemedTextClasses('muted'))}>
              Departure Date & Time
            </div>
            <div className={cn("text-lg font-semibold", getThemedTextClasses())}>
              {formatDisplayDate()}
            </div>
          </div>
        </div>
        
        {date && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gdyup-primary/20">
            <Plane className="h-4 w-4 text-gdyup-primary" />
            <span className="text-sm font-medium text-gdyup-primary">Set</span>
          </div>
        )}
      </motion.button>

      {/* Elite Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Elite Modal Content */}
            <motion.div
              className={cn(
                "fixed inset-x-4 top-1/2 -translate-y-1/2 z-[9999]",
                "max-w-md mx-auto",
                "rounded-3xl border-2 border-gdyup-border/30",
                "bg-gradient-to-b from-gdyup-bg-dark/95 to-gdyup-bg-card/95",
                "backdrop-blur-2xl shadow-2xl",
                "overflow-hidden"
              )}
              initial={{ opacity: 0, scale: 0.9, y: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, y: "-50%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gdyup-border/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn("text-xl font-bold", getThemedTextClasses())}>
                      {step === 'date' ? 'Select Date' : step === 'time' ? 'Select Time' : 'Confirm Details'}
                    </h3>
                    <p className={cn("text-sm opacity-70", getThemedTextClasses('muted'))}>
                      {step === 'date' ? 'Choose your departure date' : 
                       step === 'time' ? 'Pick your preferred time' : 
                       'Review your selection'}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-gdyup-bg-card/50 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="h-5 w-5 rotate-45 text-gdyup-text" />
                  </motion.button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mt-4">
                  {['date', 'time', 'confirm'].map((s, index) => (
                    <div
                      key={s}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-all duration-300",
                        index <= ['date', 'time', 'confirm'].indexOf(step)
                          ? "bg-gdyup-primary"
                          : "bg-gdyup-border/30"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 'date' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Quick Date Selection */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {quickDates.map((quick) => (
                          <motion.button
                            key={quick.label}
                            onClick={() => handleDateSelect(quick.date)}
                            className={cn(
                              "p-4 rounded-xl border border-gdyup-border/30",
                              "bg-gradient-to-br from-gdyup-bg-card/50 to-gdyup-bg-card/30",
                              "hover:border-gdyup-primary/50 hover:shadow-lg",
                              "transition-all duration-200",
                              "text-left"
                            )}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className={cn("font-semibold text-sm", getThemedTextClasses())}>
                              {quick.label}
                            </div>
                            <div className={cn("text-xs opacity-70", getThemedTextClasses('muted'))}>
                              {quick.subtitle}
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Calendar */}
                      <div className="space-y-4">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between">
                          <motion.button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 rounded-full hover:bg-gdyup-bg-card/50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ChevronLeft className="h-5 w-5 text-gdyup-text" />
                          </motion.button>
                          
                          <h4 className={cn("text-lg font-semibold", getThemedTextClasses())}>
                            {format(currentMonth, 'MMMM yyyy')}
                          </h4>
                          
                          <motion.button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 rounded-full hover:bg-gdyup-bg-card/50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ChevronRight className="h-5 w-5 text-gdyup-text" />
                          </motion.button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className={cn(
                              "h-8 flex items-center justify-center text-xs font-medium",
                              getThemedTextClasses('muted')
                            )}>
                              {day}
                            </div>
                          ))}
                          
                          {calendarDays.map((day, index) => (
                            <motion.button
                              key={index}
                              onClick={() => !day.isPast && handleDateSelect(day.date)}
                              disabled={day.isPast}
                              className={cn(
                                "h-10 flex items-center justify-center rounded-lg text-sm font-medium",
                                "transition-all duration-200",
                                day.isPast && "opacity-30 cursor-not-allowed",
                                !day.isCurrentMonth && "opacity-50",
                                day.isToday && "bg-gdyup-primary/20 text-gdyup-primary border border-gdyup-primary/30",
                                day.isSelected && "bg-gdyup-primary text-gdyup-button-text",
                                !day.isSelected && !day.isToday && !day.isPast && "hover:bg-gdyup-bg-card/50",
                                getThemedTextClasses()
                              )}
                              whileHover={!day.isPast ? { scale: 1.1 } : {}}
                              whileTap={!day.isPast ? { scale: 0.9 } : {}}
                            >
                              {day.date.getDate()}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'time' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Time Slots */}
                      <div className="space-y-3">
                        {['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night'].map((period) => {
                          const periodSlots = timeSlots.filter(slot => slot.period.includes(period.split(' ')[0]));
                          if (periodSlots.length === 0) return null;

                          return (
                            <div key={period} className="space-y-2">
                              <h5 className={cn("text-sm font-medium opacity-70", getThemedTextClasses('muted'))}>
                                {period}
                              </h5>
                              <div className="grid grid-cols-3 gap-2">
                                {periodSlots.map((slot) => (
                                  <motion.button
                                    key={slot.value}
                                    onClick={() => handleTimeSelect(slot.value)}
                                    className={cn(
                                      "p-3 rounded-lg border transition-all duration-200",
                                      selectedTime === slot.value || (date && format(date, 'HH:mm') === slot.value)
                                        ? "border-gdyup-primary bg-gdyup-primary/20 text-gdyup-primary"
                                        : "border-gdyup-border/30 bg-gdyup-bg-card/30 hover:border-gdyup-primary/50",
                                      getThemedTextClasses()
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <div className="text-sm font-semibold">
                                      {slot.label}
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {step === 'confirm' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="text-center space-y-6"
                    >
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-gdyup-primary/10 to-gdyup-primary/5 border border-gdyup-primary/20">
                        <CheckCircle2 className="h-12 w-12 text-gdyup-primary mx-auto mb-4" />
                        <h4 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                          Perfect Choice!
                        </h4>
                        <p className={cn("text-lg", getThemedTextClasses())}>
                          {formatDisplayDate()}
                        </p>
                        <p className={cn("text-sm opacity-70 mt-2", getThemedTextClasses('muted'))}>
                          {date && format(date, 'EEEE, MMMM do, yyyy')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gdyup-border/20 flex gap-3">
                {step !== 'date' && (
                  <motion.button
                    onClick={() => setStep(step === 'time' ? 'date' : 'time')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border border-gdyup-border/30",
                      "bg-gdyup-bg-card/30 hover:bg-gdyup-bg-card/50",
                      "transition-all duration-200",
                      getThemedTextClasses()
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                )}
                
                <motion.button
                  onClick={step === 'confirm' ? handleConfirm : () => {
                    if (step === 'date' && date) setStep('time');
                    else if (step === 'time') setStep('confirm');
                  }}
                  disabled={step === 'date' && !date}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-semibold",
                    "bg-gdyup-primary text-gdyup-button-text",
                    "hover:brightness-110 disabled:opacity-50",
                    "transition-all duration-200",
                    "disabled:cursor-not-allowed"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {step === 'confirm' ? 'Confirm Selection' : 'Continue'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Define the exportable component
export function ThemedDateTimePicker(props: ThemedDateTimePickerProps) {
  return <ThemedDateTimePickerClient {...props} />;
} 