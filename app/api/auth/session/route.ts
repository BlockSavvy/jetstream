import { NextResponse } from 'next/server';

// This is a stub endpoint that returns an empty session
// This prevents 404 errors when Next.js tries to fetch the session
export async function GET() {
  return NextResponse.json({ user: null, expires: null });
} 