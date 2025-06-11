'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import Script from 'next/script';

/**
 * Client component to safely initialize theme from localStorage
 * This avoids hydration mismatches by fully running on the client
 */
export function ThemeInitializer() {
  useEffect(() => {
    // Only run on client side after hydration
    try {
      let savedTheme;
      try {
        savedTheme = localStorage.getItem('gdyup-theme');
      } catch (storageErr) {
        console.error('Theme storage access error:', storageErr);
        savedTheme = null;
      }
      
      if (savedTheme && ['default', 'luxury', 'bitcoin'].includes(savedTheme)) {
        const htmlEl = document.documentElement;
        // Apply theme class safely
        htmlEl.classList.remove('gdyup-theme-default', 'gdyup-theme-luxury', 'gdyup-theme-bitcoin');
        htmlEl.classList.add(`gdyup-theme-${savedTheme}`);
      }
    } catch (err) {
      console.error('Error in ThemeInitializer:', err);
    }
  }, []);

  return null; // Render nothing
}

/**
 * A component to safely render children only after hydration is complete
 * Use this to wrap components that might cause hydration mismatches
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * A wrapper that prevents hydration mismatches for date/time functions
 * Use this for components that use Date.now() or similar functions
 */
export function HydrationSafeWrapper({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div suppressHydrationWarning={true}>
      {isClient ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </div>
  );
}

/**
 * Script loader that waits for hydration to complete
 * This avoids issues with script execution during hydration
 */
export function SafeScriptLoader({ src, id, strategy = 'afterInteractive' }: { 
  src: string,
  id?: string,
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' 
}) {
  return <Script src={src} id={id} strategy={strategy} />;
}

/**
 * Get a value only on the client side
 * Helps prevent hydration mismatches with client-only values
 */
export function useClientValue<T>(getValue: () => T, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only run once when component mounts
    if (!isMounted) {
      setIsMounted(true);
      setValue(getValue());
    }
  // Intentionally omit getValue from dependencies to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  return isMounted ? value : defaultValue;
}

/**
 * Get client-side class names only after hydration
 * This prevents hydration mismatches with dynamic class names
 */
export function useClientClass(className: string): string {
  return useClientValue(() => className, '');
}

/**
 * Get client-side styles only after hydration
 * This prevents hydration mismatches with dynamic styles
 */
export function useClientStyle(styleObj: Record<string, string | number>): Record<string, string | number> {
  return useClientValue(() => styleObj, {});
}

/**
 * UseEffect on the first client render only
 * This helps avoid issues with useEffect running multiple times
 */
export function useFirstClientRender(callback: () => void | (() => void)) {
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return callback();
    }
  }, [callback]);
} 