'use client';

import React from 'react';
import { ClientContentWrapper } from '../components/ClientContentWrapper';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { Plane, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FlightsPage() {
  const { getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();

  return (
    <ClientContentWrapper showHeader={true}>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-5 md:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gdyup-primary">
              My Flights
            </h1>
            <p className={cn("text-xl", getThemedTextClasses())}>
              Manage your booked flights and listings
            </p>
          </div>

          {/* Flight Status Tabs */}
          <div className="flex space-x-1 mb-6 bg-gdyup-bg-dark rounded-lg p-1">
            {['Active', 'Upcoming', 'Completed'].map((tab, index) => (
              <button
                key={tab}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                  index === 0 
                    ? "bg-gdyup-primary text-black" 
                    : "text-gdyup-text-medium hover:text-gdyup-text"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* My Flights List */}
          <div className="space-y-4 mb-8">
            {/* Active Flight Example */}
            <div className={cn(
              "p-6 rounded-xl shadow-lg border-l-4 border-gdyup-primary",
              getThemedBackgroundClasses('card')
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gdyup-primary/20 rounded-full p-2">
                    <Plane className="w-5 h-5 text-gdyup-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gdyup-text">NYC → LAX</h3>
                    <p className="text-sm text-gdyup-text-medium">Citation X • 8 seats total</p>
                  </div>
                </div>
                <div className="bg-green-500/20 rounded-full px-3 py-1">
                  <span className="text-green-400 text-xs font-medium">Active</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gdyup-text-medium" />
                  <span className="text-sm text-gdyup-text">Aug 15, 2024</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gdyup-text-medium" />
                  <span className="text-sm text-gdyup-text">2:30 PM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gdyup-text-medium" />
                  <span className="text-sm text-gdyup-text">3 seats listed</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gdyup-text-medium">Revenue</p>
                  <p className="text-lg font-bold text-gdyup-primary">$8,550</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button size="sm" className={getThemedButtonClasses('primary')}>
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Manage Listing
                </Button>
                <Button size="sm" variant="outline">
                  Contact Passengers
                </Button>
              </div>
            </div>

            {/* Upcoming Flight Example */}
            <div className={cn(
              "p-6 rounded-xl shadow-lg border-l-4 border-blue-500",
              getThemedBackgroundClasses('card')
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/20 rounded-full p-2">
                    <Plane className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gdyup-text">MIA → NYC</h3>
                    <p className="text-sm text-gdyup-text-medium">G450 • 6 seats available</p>
                  </div>
                </div>
                <div className="bg-blue-500/20 rounded-full px-3 py-1">
                  <span className="text-blue-400 text-xs font-medium">Upcoming</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gdyup-text-medium" />
                  <span className="text-sm text-gdyup-text">Aug 22, 2024</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gdyup-text-medium" />
                  <span className="text-sm text-gdyup-text">4:45 PM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gdyup-text-medium" />
                  <span className="text-sm text-gdyup-text">1 seat booked</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gdyup-text-medium">Projected</p>
                  <p className="text-lg font-bold text-blue-400">$3,200</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button size="sm" className={getThemedButtonClasses('primary')}>
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Edit Listing
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={cn(
            "p-6 rounded-xl",
            getThemedBackgroundClasses('card')
          )}>
            <h3 className="text-xl font-bold text-gdyup-text mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Button className={cn(getThemedButtonClasses('primary'), "h-12")}>
                List New Flight
              </Button>
              <Button variant="outline" className="h-12">
                Flight History
              </Button>
              <Button variant="outline" className="h-12">
                Earnings Report
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className={cn(
            "mt-6 p-6 rounded-xl",
            getThemedBackgroundClasses('card')
          )}>
            <h3 className="text-xl font-bold text-gdyup-text mb-4">Your Statistics</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gdyup-primary mb-2">12</div>
                <p className="text-sm text-gdyup-text-medium">Total Flights</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gdyup-primary mb-2">$47K</div>
                <p className="text-sm text-gdyup-text-medium">Total Earnings</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gdyup-primary mb-2">68%</div>
                <p className="text-sm text-gdyup-text-medium">Avg. Cost Recovery</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gdyup-primary mb-2">4.9</div>
                <p className="text-sm text-gdyup-text-medium">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientContentWrapper>
  );
} 