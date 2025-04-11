import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// Types for the component
type Location = {
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  iata: string;
  latitude: number;
  longitude: number;
};

type Jet = {
  id: string;
  model: string;
  manufacturer: string;
  imageUrl: string;
  range: number;
  speed: number;
  passengerCapacity: number;
  amenities: string[];
  yearManufactured: number;
};

type ExclusiveFlight = {
  id: string;
  fromLocation: Location;
  toLocation: Location;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  aiMatchScore: number;
  availableSeats: number;
  totalSeats: number;
  jet: Jet;
  isExclusive: boolean;
  exclusiveTag: string;
  exclusiveBenefits: string[];
  limitedTimeOffer: boolean;
  offerExpiresAt: string;
};

type ExclusiveFlightsProps = {
  customEndpoint?: string;
  maxResults?: number;
  onFlightSelect?: (flight: ExclusiveFlight) => void;
};

// Styled components for the UI
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #f8f9fa;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #adb5bd;
  margin: 8px 0 0 0;
`;

const FlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  width: 100%;
`;

const FlightCard = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(26, 32, 58, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }
`;

const ImageContainer = styled.div`
  height: 180px;
  overflow: hidden;
  position: relative;
`;

const JetImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ExclusiveTag = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  font-weight: 600;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MatchScore = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  
  span:first-child {
    font-size: 20px;
    font-weight: 700;
  }
  
  span:last-child {
    font-size: 10px;
    text-transform: uppercase;
  }
`;

const FlightContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const FlightRoute = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Location = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .code {
    font-size: 24px;
    font-weight: 700;
    color: #f8f9fa;
  }
  
  .city {
    font-size: 14px;
    color: #adb5bd;
  }
`;

const Arrow = styled.div`
  color: #adb5bd;
  margin: 0 12px;
  font-size: 20px;
`;

const JetDetails = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  img {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
  
  span {
    font-size: 14px;
    color: #f8f9fa;
  }
`;

const FlightDateTime = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  
  .date, .time {
    display: flex;
    flex-direction: column;
  }
  
  .label {
    font-size: 12px;
    color: #adb5bd;
    text-transform: uppercase;
  }
  
  .value {
    font-size: 16px;
    color: #f8f9fa;
    font-weight: 500;
  }
`;

const BenefitsList = styled.ul`
  margin: 0 0 16px 0;
  padding: 0 0 0 20px;
  
  li {
    color: #f8f9fa;
    font-size: 14px;
    margin-bottom: 6px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const OfferTimer = styled.div`
  background: rgba(255, 100, 100, 0.15);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  svg {
    margin-right: 8px;
    color: #ff6464;
  }
  
  span {
    font-size: 14px;
    color: #ff6464;
    font-weight: 500;
  }
`;

const AvailabilityInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .seats {
    font-size: 14px;
    color: #adb5bd;
  }
  
  .price {
    font-size: 24px;
    font-weight: 700;
    color: #f8f9fa;
  }
`;

const BookButton = styled.button`
  background: linear-gradient(135deg, #4f79ff, #4158d0);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #5a83ff, #4c63d7);
    transform: translateY(-2px);
  }
`;

// Helper functions
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const formatTime = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  return new Date(dateString).toLocaleTimeString('en-US', options);
};

const calculateTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diffMs = expiration.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m remaining`;
};

export const ExclusiveFlights: React.FC<ExclusiveFlightsProps> = ({
  customEndpoint = '/api/exclusive-flights',
  maxResults = 6,
  onFlightSelect,
}) => {
  const [flights, setFlights] = useState<ExclusiveFlight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{[key: string]: string}>({});

  // Fetch the exclusive flights data
  useEffect(() => {
    const fetchExclusiveFlights = async () => {
      try {
        setLoading(true);
        const response = await fetch(customEndpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch exclusive flights');
        }
        
        const data = await response.json();
        setFlights(data.data.slice(0, maxResults));
        
        // Initialize time remaining for each flight
        const initialTimeRemaining: {[key: string]: string} = {};
        data.data.forEach((flight: ExclusiveFlight) => {
          if (flight.limitedTimeOffer) {
            initialTimeRemaining[flight.id] = calculateTimeRemaining(flight.offerExpiresAt);
          }
        });
        setTimeRemaining(initialTimeRemaining);
        
      } catch (err) {
        setError('An error occurred while fetching exclusive flights');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExclusiveFlights();
  }, [customEndpoint, maxResults]);

  // Update the time remaining countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const updatedTimeRemaining: {[key: string]: string} = {};
      
      flights.forEach(flight => {
        if (flight.limitedTimeOffer) {
          updatedTimeRemaining[flight.id] = calculateTimeRemaining(flight.offerExpiresAt);
        }
      });
      
      setTimeRemaining(updatedTimeRemaining);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [flights]);

  const handleFlightSelect = (flight: ExclusiveFlight) => {
    if (onFlightSelect) {
      onFlightSelect(flight);
    }
  };

  if (loading) {
    return <Container>Loading exclusive flight opportunities...</Container>;
  }

  if (error) {
    return <Container>{error}</Container>;
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Exclusive Flight Opportunities</Title>
          <Subtitle>AI-matched premium flights available only to Jetstream members</Subtitle>
        </div>
      </Header>
      
      <FlightGrid>
        {flights.map(flight => (
          <FlightCard key={flight.id}>
            <ImageContainer>
              <JetImage src={flight.jet.imageUrl} alt={flight.jet.model} />
              <ExclusiveTag>{flight.exclusiveTag}</ExclusiveTag>
              <MatchScore>
                <span>{flight.aiMatchScore}</span>
                <span>Match</span>
              </MatchScore>
            </ImageContainer>
            
            <FlightContent>
              <FlightRoute>
                <Location>
                  <div className="code">{flight.fromLocation.code}</div>
                  <div className="city">{flight.fromLocation.city}</div>
                </Location>
                <Arrow>→</Arrow>
                <Location>
                  <div className="code">{flight.toLocation.code}</div>
                  <div className="city">{flight.toLocation.city}</div>
                </Location>
              </FlightRoute>
              
              <JetDetails>
                <span>{flight.jet.manufacturer} {flight.jet.model}</span>
              </JetDetails>
              
              <FlightDateTime>
                <div className="date">
                  <span className="label">Date</span>
                  <span className="value">{formatDate(flight.departureTime)}</span>
                </div>
                <div className="time">
                  <span className="label">Departure</span>
                  <span className="value">{formatTime(flight.departureTime)}</span>
                </div>
              </FlightDateTime>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#f8f9fa' }}>Exclusive Benefits:</h4>
                <BenefitsList>
                  {flight.exclusiveBenefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </BenefitsList>
              </div>
              
              {flight.limitedTimeOffer && (
                <OfferTimer>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{timeRemaining[flight.id]}</span>
                </OfferTimer>
              )}
              
              <AvailabilityInfo>
                <span className="seats">{flight.availableSeats} of {flight.totalSeats} seats available</span>
                <span className="price">${flight.basePrice.toLocaleString()}</span>
              </AvailabilityInfo>
              
              <BookButton onClick={() => handleFlightSelect(flight)}>
                Book Now
              </BookButton>
            </FlightContent>
          </FlightCard>
        ))}
      </FlightGrid>
    </Container>
  );
}; 