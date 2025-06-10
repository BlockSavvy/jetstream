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
    // Detailed error logging for debugging
    console.error('🚨 GdyupError caught:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      digest: error.digest,
      cause: error.cause,
      errorString: error.toString(),
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    // Also log the raw error object
    console.error('Raw error object:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-red-400">Something went wrong</h2>
        <div className="p-4 bg-gray-800 rounded mb-4 overflow-auto">
          <p className="text-sm font-mono whitespace-pre-wrap">
            {error.message || "Unknown error occurred"}
          </p>
          
          {error.name && (
            <p className="text-xs text-gray-400 mt-2">
              Error Type: {error.name}
            </p>
          )}
          
          {error.digest && (
            <p className="text-xs text-gray-400 mt-2">
              Error Digest: {error.digest}
            </p>
          )}
          
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer">Stack Trace</summary>
              <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
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