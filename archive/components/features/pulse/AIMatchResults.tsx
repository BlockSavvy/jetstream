import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px;
  background: linear-gradient(90deg, #0042EC 0%, #1E57FF 100%);
  color: white;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
`;

const MatchesList = styled.div`
  display: flex;
  flex-direction: column;
`;

const FlightCard = styled.div<{ matchScore: number }>`
  display: flex;
  padding: 20px 24px;
  margin: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background-color: white;
  border-left: 4px solid ${props => {
    if (props.matchScore >= 85) return '#18C76A';
    if (props.matchScore >= 70) return '#FFB800';
    return '#A0A0A0';
  }};
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const FlightInfo = styled.div`
  flex: 1;
`;

const FlightRoute = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const Location = styled.div`
  font-size: 18px;
  font-weight: 600;
`;

const Time = styled.div`
  font-size: 16px;
  color: #555;
`;

const RouteArrow = styled.div`
  margin: 0 12px;
  color: #777;
`;

const FlightDetails = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
`;

const DetailItem = styled.div`
  font-size: 14px;
  color: #555;
`;

const MatchScore = styled.div<{ score: number }>`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: ${props => {
    if (props.score >= 85) return '#18C76A';
    if (props.score >= 70) return '#FFB800';
    return '#A0A0A0';
  }};
  color: white;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 14px;
`;

const Price = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #0042EC;
  margin-top: 8px;
`;

const AmenitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const AmenityTag = styled.div`
  padding: 4px 10px;
  background-color: #F0F4FF;
  color: #0042EC;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #0042EC;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  margin-right: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: #555;
`;

// Mock data generator for demonstration
const generateMockFlights = (preferences: any = null): Flight[] => {
  const baseFlights: Flight[] = [
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
      departureTime: '01:15 PM',
      departureLocation: 'New York (KHPN)',
      arrivalTime: '03:45 PM',
      arrivalLocation: 'Miami (KOPF)',
      duration: '2h 30m',
      price: 18200,
      matchScore: 87,
      amenities: ['Wi-Fi', 'Shower', 'Entertainment System', 'Private Suite']
    },
    {
      id: 'f3',
      aircraft: 'Citation X',
      departureTime: '07:45 AM',
      departureLocation: 'New York (KLGA)',
      arrivalTime: '10:15 AM',
      arrivalLocation: 'Miami (KMIA)',
      duration: '2h 30m',
      price: 11800,
      matchScore: 76,
      amenities: ['Wi-Fi', 'Refreshments']
    },
    {
      id: 'f4',
      aircraft: 'Embraer Phenom 300',
      departureTime: '02:30 PM',
      departureLocation: 'New York (KJFK)',
      arrivalTime: '05:15 PM',
      arrivalLocation: 'Miami (KFLL)',
      duration: '2h 45m',
      price: 9500,
      matchScore: 68,
      amenities: ['Wi-Fi', 'Basic Catering']
    },
    {
      id: 'f5',
      aircraft: 'Pilatus PC-24',
      departureTime: '06:00 PM',
      departureLocation: 'New York (KTEB)',
      arrivalTime: '08:30 PM',
      arrivalLocation: 'Miami (KOPF)',
      duration: '2h 30m',
      price: 10200,
      matchScore: 73,
      amenities: ['Wi-Fi', 'Refreshments', 'Workspace']
    }
  ];

  // If preferences provided, adjust match scores
  if (preferences) {
    return baseFlights.map(flight => {
      let adjustedScore = flight.matchScore;
      
      // Simplified algorithm to demonstrate preference impact
      if (preferences.tripPreferences) {
        const pricePref = preferences.tripPreferences.find((p: any) => p.id === 'price');
        if (pricePref && pricePref.enabled) {
          // Lower price = better score if price sensitivity is high
          if (pricePref.value > 50 && flight.price > 12000) {
            adjustedScore -= Math.floor((pricePref.value / 10) * (flight.price / 5000));
          }
        }
      
        const comfortPref = preferences.tripPreferences.find((p: any) => p.id === 'comfort');
        if (comfortPref && comfortPref.enabled) {
          // More amenities = better score if comfort is important
          if (comfortPref.value > 50 && flight.amenities.length >= 3) {
            adjustedScore += Math.floor(comfortPref.value / 10);
          }
        }
      }
      
      return { ...flight, matchScore: Math.min(100, Math.max(0, adjustedScore)) };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
  
  return baseFlights.sort((a, b) => b.matchScore - a.matchScore);
};

// Main Component
export const AIMatchResults: React.FC<AIMatchResultsProps> = ({ 
  userId, 
  preferences,
  loading = false 
}) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    const loadFlights = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would be an API call
        // For demo purposes, we're using the mock generator
        setTimeout(() => {
          const matchedFlights = generateMockFlights(preferences);
          setFlights(matchedFlights);
          setIsLoading(false);
        }, 1500); // Simulate API delay
      } catch (error) {
        console.error('Error loading flight matches:', error);
        setIsLoading(false);
      }
    };

    loadFlights();
  }, [userId, preferences]);

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>AI-Matched Flights</Title>
          <Description>Finding your perfect flights based on your preferences...</Description>
        </Header>
        <LoadingState>
          <Spinner />
          <div>Analyzing available flights with your preferences...</div>
        </LoadingState>
      </Container>
    );
  }

  if (flights.length === 0) {
    return (
      <Container>
        <Header>
          <Title>AI-Matched Flights</Title>
          <Description>No flights match your current preferences</Description>
        </Header>
        <EmptyState>
          <p>Try adjusting your preferences to see more flight options.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>AI-Matched Flights</Title>
        <Description>Personalized matches based on your preferences</Description>
      </Header>
      <MatchesList>
        {flights.map((flight) => (
          <FlightCard key={flight.id} matchScore={flight.matchScore}>
            <FlightInfo>
              <FlightRoute>
                <div>
                  <Location>{flight.departureLocation}</Location>
                  <Time>{flight.departureTime}</Time>
                </div>
                <RouteArrow>→</RouteArrow>
                <div>
                  <Location>{flight.arrivalLocation}</Location>
                  <Time>{flight.arrivalTime}</Time>
                </div>
              </FlightRoute>
              <FlightDetails>
                <DetailItem><strong>Aircraft:</strong> {flight.aircraft}</DetailItem>
                <DetailItem><strong>Duration:</strong> {flight.duration}</DetailItem>
              </FlightDetails>
              <AmenitiesList>
                {flight.amenities.map((amenity, index) => (
                  <AmenityTag key={index}>{amenity}</AmenityTag>
                ))}
              </AmenitiesList>
              <Price>{formatPrice(flight.price)}</Price>
            </FlightInfo>
            <MatchScore score={flight.matchScore}>
              {flight.matchScore}% Match
            </MatchScore>
          </FlightCard>
        ))}
      </MatchesList>
    </Container>
  );
}; 