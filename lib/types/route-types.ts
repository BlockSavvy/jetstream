import { NextRequest } from 'next/server';

/**
 * Next.js 15 route types for App Router
 * These types should be used for all API route handlers
 */

// Type for route segments with dynamic parameters (Next.js 15 uses Promise for params)
export type RouteContext<T extends Record<string, string>> = {
  params: Promise<T>;
};

// Common route param types
export type IdParam = RouteContext<{ id: string }>;
export type SlugParam = RouteContext<{ slug: string }>;
export type UserIdParam = RouteContext<{ userId: string }>;
export type FlightIdParam = RouteContext<{ flightId: string }>;
export type JetShareIdParam = RouteContext<{ jetShareId: string }>;

// Type for GET handlers
export type GetRouteHandler<T extends Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<T>
) => Promise<Response>;

// Type for POST handlers
export type PostRouteHandler<T extends Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<T>
) => Promise<Response>;

// Type for PATCH handlers
export type PatchRouteHandler<T extends Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<T>
) => Promise<Response>;

// Type for DELETE handlers
export type DeleteRouteHandler<T extends Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<T>
) => Promise<Response>;

// Type for PUT handlers
export type PutRouteHandler<T extends Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<T>
) => Promise<Response>;

// Type for static route handlers (no params)
export type StaticRouteHandler = (
  request: NextRequest
) => Promise<Response>;

// Add these types for client components at the end of the file

/**
 * Client component page props types for Next.js 15
 * These work with our next-client.d.ts declaration file
 */

// Use these types in client components instead of the Promise-based versions
export type ClientParams<T> = {
  params: T;
};

// Predefined client param types for common scenarios
export type ClientIdParams = ClientParams<{ id: string }>;
export type ClientSlugParams = ClientParams<{ slug: string }>;
export type ClientUserIdParams = ClientParams<{ userId: string }>;
export type ClientFlightIdParams = ClientParams<{ flightId: string }>;
export type ClientJetShareIdParams = ClientParams<{ jetShareId: string }>; 