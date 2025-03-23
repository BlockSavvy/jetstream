import { useEffect, useState } from 'react';
import { FlightMatch, CompanionMatch, MatchingResponse } from '@/lib/types/matching.types';
import { useRouter } from 'next/navigation';
import { Flight } from '../types';
import Image from 'next/image';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface AIMatchingSectionProps {
  userId: string;
  destinationPreference?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tripPurpose?: 'business' | 'leisure' | 'mixed';
  onFlightSelect?: (flight: Flight) => void;
}

const AIMatchingSection = ({
  userId,
  destinationPreference,
  dateRange,
  tripPurpose,
  onFlightSelect
}: AIMatchingSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchingResponse | null>(null);
  const router = useRouter();

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          includeFlights: true,
          includeCompanions: true,
          destinationPreference,
          dateRange,
          tripPurpose,
          maxResults: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch matches');
      }

      const data = await response.json();
      setMatchResults(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
  }, [userId, destinationPreference, dateRange?.start, dateRange?.end, tripPurpose]);

  const handleSelectFlight = (flight: Flight) => {
    if (onFlightSelect) {
      onFlightSelect(flight);
    } else {
      router.push(`/flights/${flight.id}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Finding Your Perfect Matches...</h2>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-gray-600 text-center">
          Our AI is analyzing your preferences and finding the best matches for your travel plans.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!matchResults || 
      (!matchResults.recommendedFlights?.length && !matchResults.recommendedCompanions?.length)) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">No Matches Found</h2>
        <p className="text-gray-600 mb-4">
          We couldn't find any matches based on your preferences. Try adjusting your filters or completing your profile with more details.
        </p>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Refresh Matches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Flight Recommendations */}
      {matchResults.recommendedFlights && matchResults.recommendedFlights.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Recommended Flights</h2>
          <p className="text-gray-600 mb-4">
            These flights match your preferences and travel history.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchResults.recommendedFlights.map((flightMatch) => (
              <div 
                key={flightMatch.flight.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectFlight(flightMatch.flight)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {flightMatch.flight.origin?.city || flightMatch.flight.origin_airport} → {flightMatch.flight.destination?.city || flightMatch.flight.destination_airport}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(flightMatch.flight.departure_time)} | {formatTime(flightMatch.flight.departure_time)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatCurrency(flightMatch.flight.base_price)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {flightMatch.flight.available_seats} seats left
                    </p>
                  </div>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm">
                    <span className="font-medium">Jet:</span> {flightMatch.flight.jets.manufacturer} {flightMatch.flight.jets.model}
                  </p>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-1">Why it's a good match:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside pl-2">
                    {flightMatch.matchReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Companion Recommendations */}
      {matchResults.recommendedCompanions && matchResults.recommendedCompanions.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Recommended Travel Companions</h2>
          <p className="text-gray-600 mb-4">
            These travelers have similar preferences and might make great flight companions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matchResults.recommendedCompanions.map((companionMatch) => (
              <div 
                key={companionMatch.user.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                    {companionMatch.user.avatarUrl ? (
                      <Image
                        src={companionMatch.user.avatarUrl}
                        alt={companionMatch.user.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                        {companionMatch.user.name.substring(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{companionMatch.user.name}</h3>
                    <p className="text-sm text-gray-600">
                      {Math.round(companionMatch.matchScore * 100)}% match
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-1">Why you'd get along:</p>
                  <ul className="text-sm text-gray-700 list-disc list-inside pl-2">
                    {companionMatch.matchReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
                
                {companionMatch.compatibleFlights && companionMatch.compatibleFlights.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium">Compatible Flights:</p>
                    <p className="text-sm text-blue-600 cursor-pointer">
                      {companionMatch.compatibleFlights.length} flight{companionMatch.compatibleFlights.length > 1 ? 's' : ''} in common
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-6">
        <button
          onClick={fetchMatches}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Refresh Matches
        </button>
      </div>
    </div>
  );
};

export default AIMatchingSection; 