import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Types
interface Preference {
  id: string;
  category: string;
  name: string;
  description: string;
  value: number; // 0-100 slider value
  enabled: boolean;
}

interface PreferenceCategory {
  id: string;
  name: string;
  description: string;
  preferences: Preference[];
}

interface AIPreferencePanelProps {
  userId?: string;
  onPreferenceChange?: (preferences: Preference[]) => void;
  className?: string;
}

// Styled Components
const Container = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 24px;
  max-width: 800px;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-size: 16px;
  color: #4a4a68;
  margin: 0;
  line-height: 1.5;
`;

const CategorySection = styled.div`
  margin-bottom: 32px;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CategoryTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
`;

const CategoryDescription = styled.p`
  font-size: 14px;
  color: #4a4a68;
  margin: 4px 0 16px 0;
  line-height: 1.4;
`;

const PreferenceList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const PreferenceItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e6e8eb;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #c0c2c5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const PreferenceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const PreferenceName = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #1a73e8;
  }
  
  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const PreferenceDescription = styled.p`
  font-size: 14px;
  color: #4a4a68;
  margin: 0 0 12px 0;
  line-height: 1.4;
`;

const SliderContainer = styled.div`
  margin-top: 8px;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #4a4a68;
`;

const Slider = styled.input.attrs({ type: 'range', min: 0, max: 100 })`
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #e9ecef 60%, #1a73e8 60%);
  outline: none;
  -webkit-appearance: none;
  border-radius: 3px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1a73e8;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &::-webkit-slider-thumb {
      background: #9e9e9e;
    }
  }
`;

const SliderValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 10px 20px;
  background: ${props => props.primary ? '#1a73e8' : 'white'};
  color: ${props => props.primary ? 'white' : '#1a73e8'};
  border: 1px solid ${props => props.primary ? '#1a73e8' : '#1a73e8'};
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary ? '#1659b3' : '#f1f7fe'};
  }
`;

const mockPreferenceCategories: PreferenceCategory[] = [
  {
    id: 'category-1',
    name: 'Trip Preferences',
    description: 'Customize your preferred flight experience and travel patterns.',
    preferences: [
      {
        id: 'pref-1',
        category: 'category-1',
        name: 'Aircraft Size Preference',
        description: 'How much do you prefer larger aircraft with more amenities?',
        value: 70,
        enabled: true,
      },
      {
        id: 'pref-2',
        category: 'category-1',
        name: 'Flight Schedule Flexibility',
        description: 'How flexible are you with departure and arrival times?',
        value: 50,
        enabled: true,
      },
      {
        id: 'pref-3',
        category: 'category-1',
        name: 'Preference for Direct Flights',
        description: 'How strongly do you prefer non-stop flights over flights with stops?',
        value: 85,
        enabled: true,
      },
      {
        id: 'pref-4',
        category: 'category-1',
        name: 'Advanced Booking Period',
        description: 'Do you prefer to book flights far in advance or last minute?',
        value: 30,
        enabled: true,
      },
    ],
  },
  {
    id: 'category-2',
    name: 'Amenities & Services',
    description: 'Set your preferences for onboard amenities and services.',
    preferences: [
      {
        id: 'pref-5',
        category: 'category-2',
        name: 'Onboard Entertainment',
        description: 'How important is having premium entertainment options?',
        value: 60,
        enabled: true,
      },
      {
        id: 'pref-6',
        category: 'category-2',
        name: 'Catering Quality',
        description: 'How important is having premium food and beverage options?',
        value: 75,
        enabled: true,
      },
      {
        id: 'pref-7',
        category: 'category-2',
        name: 'Workspace Facilities',
        description: 'How important is having productive workspace during flight?',
        value: 90,
        enabled: true,
      },
      {
        id: 'pref-8',
        category: 'category-2',
        name: 'High-Speed Wi-Fi',
        description: 'How important is reliable high-speed internet access?',
        value: 95,
        enabled: true,
      },
    ],
  },
  {
    id: 'category-3',
    name: 'Price Sensitivity',
    description: 'Configure how much price factors into your flight recommendations.',
    preferences: [
      {
        id: 'pref-9',
        category: 'category-3',
        name: 'Price vs Luxury Balance',
        description: 'How much do you prioritize lower price over luxury amenities?',
        value: 40,
        enabled: true,
      },
      {
        id: 'pref-10',
        category: 'category-3',
        name: 'Special Offer Sensitivity',
        description: 'How interested are you in receiving special offers and discounts?',
        value: 85,
        enabled: true,
      },
    ],
  },
];

export const AIPreferencePanel: React.FC<AIPreferencePanelProps> = ({ 
  userId, 
  onPreferenceChange,
  className
}) => {
  const [categories, setCategories] = useState<PreferenceCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch or use mock preferences
  useEffect(() => {
    // Simulating API fetch delay
    const timer = setTimeout(() => {
      setCategories(mockPreferenceCategories);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
    
    // In a real implementation, you would fetch from an API
    // fetchPreferences(userId).then(data => {
    //   setCategories(data);
    //   setIsLoading(false);
    // }).catch(err => {
    //   setError('Failed to load preferences. Please try again.');
    //   setIsLoading(false);
    // });
  }, [userId]);
  
  // Handle toggle change
  const handleToggleChange = (preferenceId: string, enabled: boolean) => {
    setCategories(prevCategories => {
      const newCategories = prevCategories.map(category => {
        const updatedPreferences = category.preferences.map(pref =>
          pref.id === preferenceId ? { ...pref, enabled } : pref
        );
        
        return {
          ...category,
          preferences: updatedPreferences,
        };
      });
      
      // Call the callback with all preferences flattened into a single array
      const allPreferences = newCategories.flatMap(cat => cat.preferences);
      onPreferenceChange?.(allPreferences);
      
      return newCategories;
    });
  };
  
  // Handle slider change
  const handleSliderChange = (preferenceId: string, value: number) => {
    setCategories(prevCategories => {
      const newCategories = prevCategories.map(category => {
        const updatedPreferences = category.preferences.map(pref =>
          pref.id === preferenceId ? { ...pref, value } : pref
        );
        
        return {
          ...category,
          preferences: updatedPreferences,
        };
      });
      
      // Call the callback with all preferences flattened into a single array
      const allPreferences = newCategories.flatMap(cat => cat.preferences);
      onPreferenceChange?.(allPreferences);
      
      return newCategories;
    });
  };
  
  // Reset all preferences to default
  const handleReset = () => {
    setCategories(mockPreferenceCategories);
    onPreferenceChange?.(mockPreferenceCategories.flatMap(cat => cat.preferences));
  };
  
  if (isLoading) {
    return <Container className={className}>Loading your AI preferences...</Container>;
  }
  
  if (error) {
    return <Container className={className}>{error}</Container>;
  }
  
  return (
    <Container className={className}>
      <Header>
        <Title>AI Matching Preferences</Title>
        <Description>
          Customize how Pulse AI finds and recommends flights based on your preferences.
          These settings affect your AI match scores and personalized recommendations.
        </Description>
      </Header>
      
      {categories.map(category => (
        <CategorySection key={category.id}>
          <CategoryHeader>
            <CategoryTitle>{category.name}</CategoryTitle>
          </CategoryHeader>
          <CategoryDescription>{category.description}</CategoryDescription>
          
          <PreferenceList>
            {category.preferences.map(preference => (
              <PreferenceItem key={preference.id}>
                <PreferenceHeader>
                  <PreferenceName>{preference.name}</PreferenceName>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={preference.enabled}
                      onChange={(e) => handleToggleChange(preference.id, e.target.checked)}
                    />
                    <span />
                  </ToggleSwitch>
                </PreferenceHeader>
                <PreferenceDescription>{preference.description}</PreferenceDescription>
                
                <SliderContainer>
                  <SliderLabel>
                    <span>Low Priority</span>
                    <span>High Priority</span>
                  </SliderLabel>
                  <Slider
                    value={preference.value}
                    disabled={!preference.enabled}
                    onChange={(e) => handleSliderChange(preference.id, parseInt(e.target.value))}
                    style={{
                      background: `linear-gradient(90deg, #1a73e8 ${preference.value}%, #e9ecef ${preference.value}%)`,
                    }}
                  />
                  <SliderValue>{preference.value}%</SliderValue>
                </SliderContainer>
              </PreferenceItem>
            ))}
          </PreferenceList>
        </CategorySection>
      ))}
      
      <ActionButtons>
        <Button onClick={handleReset}>Reset to Default</Button>
        <Button primary>Save Preferences</Button>
      </ActionButtons>
    </Container>
  );
};

export default AIPreferencePanel; 