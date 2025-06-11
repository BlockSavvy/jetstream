'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ErrorFixPage() {
  const router = useRouter();

  const handleReload = () => {
    // Clear any cached state
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/gdyup';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gdyup-primary">
          🔧 Development Error
        </h1>
        
        <div className="p-4 bg-gray-800 rounded mb-4">
          <p className="text-sm mb-2">
            <strong>React Error #418:</strong> Hydration mismatch detected
          </p>
          <p className="text-xs text-gray-400">
            This usually happens when server and client render differently.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-sm text-gray-300">
            <strong>Common causes:</strong>
          </p>
          <ul className="text-xs text-gray-400 space-y-1 ml-4">
            <li>• State changes before hydration completes</li>
            <li>• Different content rendered on server vs client</li>
            <li>• Timing issues with useEffect hooks</li>
            <li>• Browser-only APIs called during SSR</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReload}
            className="w-full px-4 py-2 bg-gdyup-primary text-black rounded font-medium hover:bg-gdyup-primary/90 transition-colors"
          >
            🔄 Clear State & Reload
          </button>
          
          <Link 
            href="/gdyup"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded text-center hover:bg-gray-600 transition-colors"
          >
            🏠 Back to Home
          </Link>
          
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            ← Go Back
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-900/30 border border-blue-500/30 rounded">
          <p className="text-xs text-blue-300">
            💡 <strong>Dev Tip:</strong> Check browser console for detailed React error messages.
            This error page only appears in development.
          </p>
        </div>
      </div>
    </div>
  );
} 