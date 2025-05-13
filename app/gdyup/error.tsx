'use client';

import React from 'react';
import { useEffect } from 'react';

export default function GdyupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console to help with debugging
    console.error('GdyupError:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-red-400">Something went wrong</h2>
        <div className="p-4 bg-gray-800 rounded mb-4 overflow-auto">
          <p className="text-sm font-mono whitespace-pre-wrap">
            {error.message || "Unknown error occurred"}
          </p>
          
          {error.digest && (
            <p className="text-xs text-gray-400 mt-2">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => window.location.href = '/gdyup/error-fix'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Error Fix Page
          </button>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
} 