import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// This route handler exists only to ensure the page is never statically generated
export async function GET() {
  return NextResponse.json({ 
    message: 'This route exists only to ensure dynamic rendering', 
    timestamp: Date.now()
  });
} 