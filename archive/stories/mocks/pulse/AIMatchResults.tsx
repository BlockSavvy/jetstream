import React from 'react';

// Types
interface Flight {
  id: string;
  aircraft: string;
  departureTime: string;
  departureLocation: string;
  arrivalTime: string;
  arrivalLocation: string;
  duration: string;
  price: number;
  matchScore: number;
  amenities: string[];
}

interface AIMatchResultsProps {
  userId?: string;
  preferences?: any;
  loading?: boolean;
}

// Mock data generator for demonstration
const generateMockFlights = (preferences: any = null): Flight[] => {
  return [
    {
      id: 'f1',
      aircraft: 'Gulfstream G650',
      departureTime: '09:30 AM',
      departureLocation: 'New York (KTEB)',
      arrivalTime: '11:45 AM',
      arrivalLocation: 'Miami (KFLL)',
      duration: '2h 15m',
      price: 14500,
      matchScore: 92,
      amenities: ['Wi-Fi', 'Full Bed', 'Premium Catering', 'Meeting Room']
    },
    {
      id: 'f2',
      aircraft: 'Bombardier Global 7500',
      departureTime: '10:15 AM',
      departureLocation: 'New York (KJFK)',
      arrivalTime: '12:45 PM',
      arrivalLocation: 'Miami (KMIA)',
      duration: '2h 30m',
      price: 18200,
      matchScore: 85,
      amenities: ['Wi-Fi', 'King Bed', 'Premium Catering', 'Meeting Area', 'Shower']
    },
    {
      id: 'f3',
      aircraft: 'Citation X',
      departureTime: '08:00 AM',
      departureLocation: 'New York (KTEB)',
      arrivalTime: '10:30 AM',
      arrivalLocation: 'Miami (KFLL)',
      duration: '2h 30m',
      price: 9800,
      matchScore: 74,
      amenities: ['Wi-Fi', 'Snacks', 'Basic Catering']
    }
  ];
};

// Format price as currency
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
};

export const AIMatchResults: React.FC<AIMatchResultsProps> = ({ 
  userId, 
  preferences,
  loading = false 
}) => {
  const flights = generateMockFlights(preferences);
  
  if (loading) {
    return (
      <div className="flex flex-col w-full max-w-3xl bg-white rounded-xl shadow-lg">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-t-xl">
          <h2 className="text-2xl font-semibold mb-1">Your AI Matches</h2>
          <p className="opacity-90">Personalized flight options based on your preferences</p>
        </div>
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mr-4"></div>
          <p className="text-gray-600">Finding your perfect flight matches...</p>
        </div>
      </div>
    );
  }
  
  if (!flights || flights.length === 0) {
    return (
      <div className="flex flex-col w-full max-w-3xl bg-white rounded-xl shadow-lg">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-t-xl">
          <h2 className="text-2xl font-semibold mb-1">Your AI Matches</h2>
          <p className="opacity-90">Personalized flight options based on your preferences</p>
        </div>
        <div className="p-10 text-center text-gray-600">
          <p className="text-xl mb-2">No matches found</p>
          <p>Try adjusting your preferences to see more options</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <h2 className="text-2xl font-semibold mb-1">Your AI Matches</h2>
        <p className="opacity-90">Personalized flight options based on your preferences</p>
      </div>
      
      <div className="flex flex-col">
        {flights.map(flight => {
          let scoreColor = 'bg-gray-500';
          if (flight.matchScore >= 85) scoreColor = 'bg-green-500';
          else if (flight.matchScore >= 70) scoreColor = 'bg-yellow-500';
          
          return (
            <div 
              key={flight.id} 
              className="flex p-5 m-3 rounded-lg shadow-sm bg-white border-l-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: flight.matchScore >= 85 
                ? '#10b981' 
                : flight.matchScore >= 70 
                  ? '#f59e0b' 
                  : '#9ca3af' 
              }}
            >
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div>
                    <div className="font-semibold text-lg">{flight.departureLocation}</div>
                    <div className="text-gray-600">{flight.departureTime}</div>
                  </div>
                  <div className="mx-3 text-gray-500">→</div>
                  <div>
                    <div className="font-semibold text-lg">{flight.arrivalLocation}</div>
                    <div className="text-gray-600">{flight.arrivalTime}</div>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-2">
                  <div className="text-gray-600 text-sm">{flight.aircraft}</div>
                  <div className="text-gray-600 text-sm">{flight.duration}</div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {flight.amenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`${scoreColor} text-white text-sm font-semibold px-2 py-1 rounded-full`}>
                  {flight.matchScore}% Match
                </span>
                <div className="text-blue-700 font-bold text-xl mt-2">{formatPrice(flight.price)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIMatchResults; 