import React from 'react';

interface Flight {
  id: string;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  aircraft: string;
  price: number;
  seatsAvailable: number;
  image: string;
}

interface ExclusiveFlightsProps {
  userId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

const mockFlights: Flight[] = [
  {
    id: 'ef-001',
    departureLocation: 'New York (KTEB)',
    arrivalLocation: 'Aspen (KASE)',
    departureTime: '09:00 AM',
    arrivalTime: '11:30 AM',
    date: '2023-12-15',
    aircraft: 'Gulfstream G650',
    price: 28500,
    seatsAvailable: 4,
    image: 'https://images.unsplash.com/photo-1612379574731-e5f6ff15b188?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80'
  },
  {
    id: 'ef-002',
    departureLocation: 'Miami (KFLL)',
    arrivalLocation: 'St. Barts (TFFJ)',
    departureTime: '10:15 AM',
    arrivalTime: '12:45 PM',
    date: '2023-12-18',
    aircraft: 'Phenom 300',
    price: 18900,
    seatsAvailable: 6,
    image: 'https://images.unsplash.com/photo-1593702288056-f282eba81e6b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  },
  {
    id: 'ef-003',
    departureLocation: 'Los Angeles (KVNY)',
    arrivalLocation: 'Cabo San Lucas (MMSD)',
    departureTime: '11:30 AM',
    arrivalTime: '01:15 PM',
    date: '2023-12-20',
    aircraft: 'Citation X',
    price: 15700,
    seatsAvailable: 8,
    image: 'https://images.unsplash.com/photo-1608228088998-57828365d486?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2082&q=80'
  }
];

// Format price as currency
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
};

// Format date 
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const ExclusiveFlights: React.FC<ExclusiveFlightsProps> = ({
  userId,
  limit = 3,
  title = "Exclusive Holiday Flights",
  className
}) => {
  const flights = mockFlights.slice(0, limit);
  
  return (
    <div className={`w-full ${className || ''}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flights.map(flight => (
          <div key={flight.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={flight.image} 
                alt={`${flight.departureLocation} to ${flight.arrivalLocation}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-semibold">{formatDate(flight.date)}</div>
                  <div className="text-sm opacity-90">{flight.departureTime} - {flight.arrivalTime}</div>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <div className="text-xl font-bold text-gray-900">
                    {flight.departureLocation.split(' ')[0]} to {flight.arrivalLocation.split(' ')[0]}
                  </div>
                  <div className="text-sm text-gray-500">{flight.aircraft}</div>
                </div>
                <div className="text-xl font-bold text-blue-600">{formatPrice(flight.price)}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">{flight.seatsAvailable} seats available</div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExclusiveFlights; 