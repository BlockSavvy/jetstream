import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log("Messages API called");
  
  // Parse query parameters
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '5');
  
  // Return empty messages array for now
  return NextResponse.json({ 
    messages: [],
    total: 0
  });
} 