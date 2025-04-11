import React from 'react';

// Types 
interface Preference {
  id: string;
  category: string;
  name: string;
  description: string;
  value: number; 
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

// Mock data
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
        value: 60,
        enabled: true
      },
      {
        id: 'pref-2',
        category: 'category-1',
        name: 'Price Sensitivity',
        description: 'How important is getting the best price for your journey?',
        value: 80,
        enabled: true
      }
    ]
  },
  {
    id: 'category-2',
    name: 'Personal Preferences',
    description: 'Set your personal comfort and convenience preferences.',
    preferences: [
      {
        id: 'pref-3',
        category: 'category-2',
        name: 'Entertainment Options',
        description: 'Priority for in-flight entertainment systems',
        value: 50,
        enabled: true
      },
      {
        id: 'pref-4',
        category: 'category-2',
        name: 'Workspace Availability',
        description: 'Importance of having suitable workspace onboard',
        value: 70,
        enabled: true
      }
    ]
  }
];

export const AIPreferencePanel: React.FC<AIPreferencePanelProps> = ({ 
  userId, 
  onPreferenceChange,
  className
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 max-w-3xl w-full ${className || ''}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">AI Matching Preferences</h2>
        <p className="text-gray-600">
          Customize how Pulse AI finds and recommends flights based on your preferences.
          These settings affect your AI match scores and personalized recommendations.
        </p>
      </div>
      
      {mockPreferenceCategories.map(category => (
        <div key={category.id} className="mb-8">
          <h3 className="text-xl font-medium text-gray-800 mb-1">{category.name}</h3>
          <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.preferences.map(preference => (
              <div key={preference.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all">
                <div className="flex justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{preference.name}</h4>
                  <label className="relative inline-block w-11 h-6">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={preference.enabled}
                      onChange={() => onPreferenceChange?.([])}
                    />
                    <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all ${preference.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`absolute h-5 w-5 bg-white rounded-full transition-all ${preference.enabled ? 'left-6' : 'left-1'}`}></span>
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-3">{preference.description}</p>
                
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Low Priority</span>
                    <span>High Priority</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={preference.value}
                    disabled={!preference.enabled}
                    onChange={() => onPreferenceChange?.([])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">{preference.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="flex justify-end gap-3 mt-6">
        <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium text-sm">
          Reset to Default
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm">
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default AIPreferencePanel; 