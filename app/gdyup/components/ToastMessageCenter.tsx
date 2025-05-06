'use client';

import { Toaster } from 'sonner';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

export function ToastMessageCenter() {
  const { theme } = useGdyupTheme();
  
  // Choose theme-specific colors for the toasts
  const getToastTheme = () => {
    switch (theme) {
      case 'blue':
        return {
          background: '#0f172a', // dark blue
          foreground: '#e2e8f0', // light text
          border: '#1e3a8a', // border blue
          success: '#10b981', // success green
          error: '#ef4444', // error red
          warning: '#f59e0b', // warning amber
          info: '#3b82f6', // info blue
        };
      case 'pink':
        return {
          background: '#4a1d2e', // dark pink
          foreground: '#fce7f3', // light text
          border: '#831843', // border pink
          success: '#10b981', // success green
          error: '#ef4444', // error red
          warning: '#f59e0b', // warning amber
          info: '#be123c', // info pink
        };
      default:
        return {
          background: '#1c1c1c', // dark gray
          foreground: '#f5f5f5', // light text
          border: '#333333', // border gray
          success: '#10b981', // success green
          error: '#ef4444', // error red
          warning: '#f59e0b', // warning amber
          info: '#daff0d', // GDYUP primary
        };
    }
  };
  
  const toastTheme = getToastTheme();
  
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: toastTheme.background,
          color: toastTheme.foreground,
          border: `1px solid ${toastTheme.border}`,
        },
        className: "gdyup-toast",
        descriptionClassName: "gdyup-toast-description",
      }}
      className="gdyup-toaster"
    />
  );
} 