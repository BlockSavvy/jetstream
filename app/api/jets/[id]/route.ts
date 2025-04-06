import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    message: "Jets API endpoint works",
    id: params.id
  });
} 