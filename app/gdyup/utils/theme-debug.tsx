'use client';

import React, { useEffect, useState } from 'react';
import { useGdyupTheme } from "@/app/gdyup/hooks/useGdyupTheme";
import { cn } from "@/lib/utils";
import { X, Check, AlertTriangle, Bug, RefreshCw } from "lucide-react";

// Flag to track if theme debugging is disabled
let themeDebugDisabled = false;

// Server-safe method (no client-side code)
export const getInitialThemeDebugState = () => {
  return { themeDebugDisabled: false };
};

/**
 * Disables theme debugging globally
 */
export function disableThemeDebugging() {
  themeDebugDisabled = true;
  
  // If in browser environment, remove the debug element
  if (typeof window !== 'undefined') {
    // Remove any existing theme debug panels
    const themeDebugElements = document.querySelectorAll('[data-theme-debug="true"]');
    themeDebugElements.forEach(el => el.remove());
    
    // Set a flag in localStorage to persist the setting
    try {
      localStorage.setItem('gdyup-theme-debug-disabled', 'true');
    } catch (e) {
      console.error('Error setting localStorage item:', e);
    }
  }
  
  return themeDebugDisabled;
}

/**
 * Check if theme debugging is currently disabled
 */
export function isThemeDebuggingDisabled(): boolean {
  // First check the global flag
  if (themeDebugDisabled) return true;
  
  // Then check localStorage if in browser
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('gdyup-theme-debug-disabled') === 'true';
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  }
  
  return false;
}

/**
 * Hook to disable theme debugging in a component
 */
export function useDisableThemeDebugging() {
  useEffect(() => {
    disableThemeDebugging();
    
    // Cleanup function to ensure debug elements are removed
    return () => {
      if (typeof window !== 'undefined') {
        const themeDebugElements = document.querySelectorAll('[data-theme-debug="true"]');
        themeDebugElements.forEach(el => el.remove());
      }
    };
  }, []);
}

/**
 * Component that disables theme debugging
 * Safe to use in layouts - avoids hydration mismatches
 */
export function ThemeDebugDisabler() {
  // Implement the component in a hydration-safe way
  const [isMounted, setIsMounted] = useState(false);
  
  // Only run disableThemeDebugging on the client after hydration
  useEffect(() => {
    setIsMounted(true);
    disableThemeDebugging();
  }, []);
  
  // Return null during server-side rendering to avoid hydration mismatches
  // The component will become visible only after mounting
  if (!isMounted) {
    return null;
  }
  
  // Return an empty div with no content
  return <div style={{ display: 'none' }} aria-hidden="true" data-debug-disabler />;
}

/**
 * Component that displays current theme information and provides debugging tools
 * Add this component to any page for troubleshooting theme issues
 */
export function ThemeDebugger() {
  // Initialize state only after component is mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [highlightButtons, setHighlightButtons] = useState(false);
  const [highlightDropdowns, setHighlightDropdowns] = useState(false);
  const [activeThemeClass, setActiveThemeClass] = useState("");
  
  // Safe access to theme
  const { theme: currentTheme, changeTheme: setTheme } = useGdyupTheme();

  // Prevent hydration mismatch by only initializing after mount
  useEffect(() => {
    setMounted(true);
    
    // Check if debugging is disabled
    if (isThemeDebuggingDisabled()) {
      setShowDebugInfo(false);
      return;
    }

    // Find which theme class is actually applied
    const themeClasses = ['gdyup-theme-default', 'gdyup-theme-luxury', 'gdyup-theme-bitcoin'];
    const htmlEl = document.documentElement;
    
    const appliedTheme = themeClasses.find(themeClass => 
      htmlEl.classList.contains(themeClass)
    ) || 'none';
    
    setActiveThemeClass(appliedTheme);
  }, [currentTheme]);

  // Function to check for invisible text issues
  const diagnoseBadContrastIssues = () => {
    const buttons = document.querySelectorAll('button');
    let issuesFound = 0;

    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Very simplistic contrast check - just for demonstration
      if (bgColor === textColor || 
          (bgColor === 'rgb(255, 255, 255)' && textColor === 'rgb(255, 255, 255)') ||
          (bgColor === 'rgb(0, 0, 0)' && textColor === 'rgb(0, 0, 0)')) {
        (button as HTMLElement).style.outline = '3px dashed red';
        issuesFound++;
      }
    });

    return issuesFound;
  };

  // Handler for highlighting problematic elements
  const highlightThemeIssues = () => {
    setHighlightButtons(true);
    
    // Add debug outlines to buttons
    document.querySelectorAll('button').forEach(button => {
      button.classList.add('theme-debug');
    });
  };

  // Handler for highlighting dropdowns
  const highlightDropdownIssues = () => {
    setHighlightDropdowns(true);
    
    // Add debug outlines to dropdown menu components
    document.querySelectorAll('[role="menu"], [role="menuitem"], [data-radix-popper-content-wrapper]').forEach(el => {
      el.classList.add('theme-debug');
    });
  };

  // Clear all debug highlights
  const clearHighlights = () => {
    setHighlightButtons(false);
    setHighlightDropdowns(false);
    
    document.querySelectorAll('.theme-debug').forEach(el => {
      el.classList.remove('theme-debug');
    });
  };

  // Apply emergency fix for common theme issues
  const applyEmergencyFixes = () => {
    // Fix for invisible text in buttons
    document.querySelectorAll('button.bg-primary, button[type="submit"]').forEach(button => {
      (button as HTMLElement).style.color = '#000000';
      (button as HTMLElement).style.backgroundColor = 'var(--gdyup-primary)';
    });
    
    // Fix for invisible text in menus
    document.querySelectorAll('[role="menuitem"], [role="menu"] div').forEach(el => {
      (el as HTMLElement).style.color = 'var(--gdyup-text, #FFFFFF)';
      (el as HTMLElement).style.backgroundColor = 'var(--gdyup-bg-card, #111111)';
    });
  };

  // Avoid rendering anything on server or during hydration
  if (!mounted) return null;

  // When the debugger is closed, don't show a button - rely on the header buttons instead
  if (!showDebugInfo) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-auto backdrop-blur-sm bg-black/70"
      data-theme-debug="true"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          setShowDebugInfo(false);
        }
      }}
    >
      <div 
        className="m-4 w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--gdyup-bg-dark, #000000)',
          borderColor: 'var(--gdyup-border, #2a2a2a)',
          border: '1px solid var(--gdyup-border, #2a2a2a)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center p-4 border-b"
          style={{
            backgroundColor: 'var(--gdyup-primary, #DAFF0D)',
            color: 'var(--gdyup-button-text, #000000)',
            borderColor: 'var(--gdyup-border, #2a2a2a)'
          }}
        >
          <div className="flex items-center space-x-2">
            <Bug size={20} />
            <h3 className="text-lg font-bold">GDY·UP Theme Debugger</h3>
          </div>
          <button
            onClick={() => setShowDebugInfo(false)}
            className="p-1 rounded-full hover:bg-black/10"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Theme info */}
        <div 
          className="p-4 border-b"
          style={{ borderColor: 'var(--gdyup-border, #2a2a2a)' }}
        >
          <p className="mb-2 text-lg font-medium" style={{ color: 'var(--gdyup-text, #FFFFFF)' }}>
            Current Theme: <span className="font-bold" style={{ color: 'var(--gdyup-primary)' }}>{currentTheme}</span>
          </p>
          <p className="mb-3 text-sm opacity-80" style={{ color: 'var(--gdyup-text, #FFFFFF)' }}>
            Active Theme Class: <code className="font-mono bg-black/20 px-1 py-0.5 rounded">{activeThemeClass}</code>
          </p>
          
          {/* Theme selector */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              onClick={() => setTheme('default')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex flex-col items-center justify-center h-20`}
              style={{
                backgroundColor: currentTheme === 'default' 
                  ? 'var(--gdyup-primary, #DAFF0D)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: currentTheme === 'default' 
                  ? 'var(--gdyup-button-text, #000000)' 
                  : 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid ${currentTheme === 'default' ? 'var(--gdyup-primary, #DAFF0D)' : 'var(--gdyup-border, #2a2a2a)'}`
              }}
            >
              <div 
                className="w-8 h-8 rounded-full mb-1"
                style={{ background: 'linear-gradient(to right, #DAFF0D, #C8EB00)' }}
              ></div>
              <span>Default<br/>(Lime)</span>
              {currentTheme === 'default' && (
                <Check className="absolute bottom-1 right-1" size={14} />
              )}
            </button>
            
            <button
              onClick={() => setTheme('luxury')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex flex-col items-center justify-center h-20`}
              style={{
                backgroundColor: currentTheme === 'luxury' 
                  ? 'var(--gdyup-primary, #39FF14)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: currentTheme === 'luxury' 
                  ? 'var(--gdyup-button-text, #000000)' 
                  : 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid ${currentTheme === 'luxury' ? 'var(--gdyup-primary, #39FF14)' : 'var(--gdyup-border, #2a2a2a)'}`
              }}
            >
              <div 
                className="w-8 h-8 rounded-full mb-1"
                style={{ background: 'linear-gradient(to right, #DC143C, #A0001C)' }}
              ></div>
              <span>Luxury<br/>(Crimson)</span>
              {currentTheme === 'luxury' && (
                <Check className="absolute bottom-1 right-1" size={14} />
              )}
            </button>
            
            <button
              onClick={() => setTheme('bitcoin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex flex-col items-center justify-center h-20`}
              style={{
                backgroundColor: currentTheme === 'bitcoin' 
                  ? 'var(--gdyup-primary, #F7931A)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: currentTheme === 'bitcoin' 
                  ? 'var(--gdyup-button-text, #000000)' 
                  : 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid ${currentTheme === 'bitcoin' ? 'var(--gdyup-primary, #F7931A)' : 'var(--gdyup-border, #2a2a2a)'}`
              }}
            >
              <div 
                className="w-8 h-8 rounded-full mb-1"
                style={{ background: 'linear-gradient(to right, #F7931A, #FFAA33)' }}
              ></div>
              <span>Bitcoin<br/>(Orange)</span>
              {currentTheme === 'bitcoin' && (
                <Check className="absolute bottom-1 right-1" size={14} />
              )}
            </button>
          </div>
        </div>
        
        {/* Debug tools */}
        <div className="p-4">
          <h4 
            className="font-medium mb-3 border-b pb-2"
            style={{ 
              color: 'var(--gdyup-text, #FFFFFF)',
              borderColor: 'var(--gdyup-border, #2a2a2a)' 
            }}
          >
            Debug Tools
          </h4>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={highlightThemeIssues}
              className="p-2 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: highlightButtons ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: highlightButtons ? '#FFC107' : 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid ${highlightButtons ? '#FFC107' : 'var(--gdyup-border, #2a2a2a)'}`
              }}
            >
              Highlight Buttons
            </button>
            
            <button
              onClick={highlightDropdownIssues}
              className="p-2 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: highlightDropdowns ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: highlightDropdowns ? '#FFC107' : 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid ${highlightDropdowns ? '#FFC107' : 'var(--gdyup-border, #2a2a2a)'}`
              }}
            >
              Highlight Dropdowns
            </button>
            
            <button
              onClick={() => diagnoseBadContrastIssues()}
              className="p-2 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid var(--gdyup-border, #2a2a2a)`
              }}
            >
              <div className="flex items-center justify-center">
                <AlertTriangle size={14} className="mr-1" />
                <span>Check Contrast</span>
              </div>
            </button>
            
            <button
              onClick={clearHighlights}
              className="p-2 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--gdyup-text, #FFFFFF)',
                border: `1px solid var(--gdyup-border, #2a2a2a)`
              }}
            >
              <div className="flex items-center justify-center">
                <RefreshCw size={14} className="mr-1" />
                <span>Clear Highlights</span>
              </div>
            </button>
          </div>
          
          <button
            onClick={applyEmergencyFixes}
            className="w-full p-3 rounded-lg text-sm font-bold"
            style={{
              backgroundColor: 'rgba(244, 67, 54, 0.15)',
              color: '#F44336',
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }}
          >
            Apply Emergency Fixes
          </button>
          
          <div 
            className="mt-4 p-3 text-xs rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--gdyup-text-subtle, #888)',
              border: `1px solid var(--gdyup-border, #2a2a2a)`
            }}
          >
            <p className="mb-1">Add CSS classes to troubleshoot theme issues:</p>
            <code className="font-mono bg-black/20 px-1 py-0.5 rounded">theme-debug</code> - Show element outline
            <br />
            <code className="font-mono bg-black/20 px-1 py-0.5 rounded">theme-vars</code> - Display CSS variables
          </div>
        </div>
        
        {/* Footer with close button */}
        <div 
          className="p-3 border-t flex justify-center"
          style={{ borderColor: 'var(--gdyup-border, #2a2a2a)' }}
        >
          <button
            onClick={() => setShowDebugInfo(false)}
            className="px-4 py-2 rounded-lg font-medium w-full"
            style={{
              backgroundColor: 'var(--gdyup-primary)',
              color: 'var(--gdyup-button-text, #000000)'
            }}
          >
            Hide Theme Debug
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Display CSS variables being used on a component 
 */
export function ThemeVarsDisplay({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-vars">
      {children}
    </div>
  );
}

/**
 * Diagnostic button that shows right vs wrong styling
 */
export function ThemeDiagnosticButton() {
  const { theme: currentTheme } = useGdyupTheme();
  
  return (
    <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
      <div>
        <h3 className="text-lg font-bold mb-2">Theme Button Diagnostic</h3>
        <p className="text-sm text-gray-400">
          Current theme: {currentTheme}. All buttons below should have the proper text contrast.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Correct Buttons</h4>
          <div className="space-y-2">
            <button className="gdyup-button w-full">
              Primary Button
            </button>
            <button className="gdyup-button-outline w-full">
              Outline Button
            </button>
            <button className="main-cta-button w-full">
              CTA Button
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-2">Test Emergency Classes</h4>
          <div className="space-y-2">
            <button className="bg-primary force-text-dark w-full rounded py-2">
              Force Dark Text
            </button>
            <button className="bg-black force-text-light w-full rounded py-2">
              Force Light Text
            </button>
            <button className="force-bg-primary force-text-dark w-full rounded py-2">
              Force Primary BG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 