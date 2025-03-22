'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plane, 
  Plus,
  Users
} from 'lucide-react'
import Link from 'next/link'

// Sample calendar data - would come from API in production
const SAMPLE_EVENTS = [
  {
    id: '1',
    title: 'Flight to Los Angeles',
    date: '2023-06-15',
    time: '10:00 AM - 1:30 PM',
    type: 'flight',
    details: {
      route: 'New York → Los Angeles',
      aircraft: 'Gulfstream G650',
      status: 'confirmed'
    }
  },
  {
    id: '2',
    title: 'Flight to Miami',
    date: '2023-06-22',
    time: '2:00 PM - 4:45 PM',
    type: 'flight',
    details: {
      route: 'New York → Miami',
      aircraft: 'Bombardier Global 6000',
      status: 'confirmed'
    }
  },
  {
    id: '3',
    title: 'Aircraft Maintenance',
    date: '2023-06-18',
    time: 'All Day',
    type: 'maintenance',
    details: {
      aircraft: 'Gulfstream G650',
      location: 'Teterboro Airport'
    }
  },
  {
    id: '4',
    title: 'Flight to Chicago',
    date: '2023-07-05',
    time: '8:30 AM - 10:15 AM',
    type: 'flight',
    details: {
      route: 'New York → Chicago',
      aircraft: 'Embraer Phenom 300',
      status: 'confirmed'
    }
  },
  {
    id: '5',
    title: 'Meeting with Co-Owners',
    date: '2023-06-29',
    time: '3:00 PM - 4:30 PM',
    type: 'meeting',
    details: {
      location: 'Virtual',
      subject: 'Q3 Scheduling'
    }
  }
];

// Helper function to get days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper function to get the first day of the month
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Helper function to format date
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long'
  });
};

// Get events for a specific date
const getEventsForDate = (dateString: string, events: typeof SAMPLE_EVENTS) => {
  return events.filter(event => event.date === dateString);
};

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Generate days for current month view
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };
  
  // Get today's date string for highlighting current day
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate, SAMPLE_EVENTS) : [];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage your upcoming flights and events
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{formatDate(new Date(currentYear, currentMonth))}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={i} className="text-center py-2 text-sm font-medium">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 border border-transparent rounded-md"></div>
                ))}
                
                {/* Calendar days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateString === todayDateString;
                  const isSelected = dateString === selectedDate;
                  const dayEvents = getEventsForDate(dateString, SAMPLE_EVENTS);
                  
                  return (
                    <div 
                      key={`day-${day}`}
                      className={`h-20 md:h-28 border rounded-md p-1 md:p-2 transition-colors ${
                        isSelected ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 
                        isToday ? 'border-amber-200 bg-amber-50/20 dark:bg-amber-900/5' : 
                        'border-muted hover:bg-muted/50'
                      } cursor-pointer`}
                      onClick={() => setSelectedDate(dateString)}
                    >
                      <div className="flex justify-between">
                        <span className={`text-sm font-medium ${isToday ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event, i) => (
                          <div 
                            key={i} 
                            className={`text-xs truncate px-1 py-0.5 rounded ${
                              event.type === 'flight' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              event.type === 'maintenance' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Events Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric'
                  }) : 'Events'}
                </span>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </Button>
              </CardTitle>
              <CardDescription>
                {selectedDate ? 
                  `${selectedDateEvents.length} event${selectedDateEvents.length !== 1 ? 's' : ''}` : 
                  'Select a date to view events'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <>
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateEvents.map((event) => (
                        <div key={event.id} className="border rounded-md p-3 hover:border-amber-200 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{event.title}</h3>
                              <div className="mt-1 space-y-1">
                                <p className="text-sm flex items-center text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  {event.time}
                                </p>
                                
                                {event.type === 'flight' && (
                                  <>
                                    <p className="text-sm flex items-center text-muted-foreground">
                                      <Plane className="h-3.5 w-3.5 mr-1.5" />
                                      {event.details.route}
                                    </p>
                                    <p className="text-sm flex items-center text-muted-foreground">
                                      <Users className="h-3.5 w-3.5 mr-1.5" />
                                      {event.details.aircraft}
                                    </p>
                                  </>
                                )}
                                
                                {event.type === 'maintenance' && (
                                  <>
                                    <p className="text-sm flex items-center text-muted-foreground">
                                      <Plane className="h-3.5 w-3.5 mr-1.5" />
                                      {event.details.aircraft}
                                    </p>
                                    <p className="text-sm flex items-center text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                      {event.details.location}
                                    </p>
                                  </>
                                )}
                                
                                {event.type === 'meeting' && (
                                  <>
                                    <p className="text-sm flex items-center text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                      {event.details.location}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={`capitalize ${
                                event.type === 'flight' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                event.type === 'maintenance' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-green-100 text-green-700 border-green-200'
                              }`}
                            >
                              {event.type}
                            </Badge>
                          </div>
                          {event.type === 'flight' && (
                            <div className="mt-3 pt-3 border-t">
                              <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black" asChild>
                                <Link href={`/dashboard/flights/${event.id}`}>
                                  Flight Details
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">No events</h3>
                      <p className="text-muted-foreground text-sm max-w-md mb-4">
                        There are no events scheduled for this date
                      </p>
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black gap-1">
                        <Plus className="h-4 w-4" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <p className="max-w-[200px]">
                    Select a date from the calendar to view or add events
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 