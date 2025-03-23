import { NextResponse } from 'next/server';

// This is a stub endpoint that accepts auth logs but doesn't do anything with them
// This prevents 404 errors when Next.js tries to log auth events
export async function POST() {
  return NextResponse.json({ success: true });
} 