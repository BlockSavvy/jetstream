'use client';

import { useState, useEffect } from 'react';

export function ThemeDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  const [currentTheme, setCurrentTheme] = useState<string>('');
  
  useEffect(() => {
    // Get the computed style of the document root element
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Get the current theme from localStorage
    const theme = localStorage.getItem('gdyup-theme') || 'default';
    setCurrentTheme(theme);
    
    // List of CSS variables to check
    const varsToCheck = [
      '--gdyup-primary',
      '--gdyup-secondary',
      '--gdyup-background',
      '--gdyup-card-bg',
      '--gdyup-text',
      '--gdyup-text-medium',
      '--gdyup-text-subtle',
      '--gdyup-button-bg',
      '--gdyup-button-hover-bg'
    ];
    
    // Get the current values of these variables
    const values: Record<string, string> = {};
    varsToCheck.forEach(varName => {
      values[varName] = computedStyle.getPropertyValue(varName).trim();
    });
    
    setCssVars(values);
    
    // Also collect CSS classes applied to the root element
    const classes = Array.from(root.classList);
    values['Applied Classes'] = classes.join(', ');
    
  }, [visible]);
  
  if (!visible) {
    return (
      <button 
        onClick={() => setVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-black/90 text-white px-2 py-1 text-xs rounded-md border border-white/30"
      >
        Debug Theme
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg border border-white/30 max-w-xs max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Theme Debug</h3>
        <button 
          onClick={() => setVisible(false)}
          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
        >
          Close
        </button>
      </div>
      
      <div className="mb-2">
        <span className="text-xs font-bold">Current Theme: </span>
        <span className="text-xs">{currentTheme}</span>
      </div>
      
      <div className="text-xs space-y-1">
        {Object.entries(cssVars).map(([varName, value]) => (
          <div key={varName} className="flex justify-between">
            <span className="font-mono">{varName}:</span>
            <span 
              className="font-mono" 
              style={{
                backgroundColor: value.startsWith('#') ? value : 'transparent',
                color: value.startsWith('#') ? (getLuminance(value) > 0.5 ? 'black' : 'white') : 'inherit',
                padding: value.startsWith('#') ? '0 4px' : '0',
                borderRadius: '2px'
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to calculate luminance of a hex color
function getLuminance(hexColor: string): number {
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substr(0, 2), 16) / 255;
  const g = parseInt(hexColor.substr(2, 2), 16) / 255;
  const b = parseInt(hexColor.substr(4, 2), 16) / 255;
  
  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
} 