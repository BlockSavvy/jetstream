import { NextRequest, NextResponse } from 'next/server';
import { addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  // Return sample flight chats for development
  const now = new Date();
  
  const sampleChats = [
    {
      id: '1',
      offerId: 'flight-chat-offer-1',
      flightNumber: 'GDY123',
      departureLocation: 'New York (NYC)',
      arrivalLocation: 'Miami (MIA)',
      departureTime: addDays(now, 7).toISOString(),
      participantCount: 4,
      unreadCount: 2,
      lastMessageTime: new Date().toISOString(),
      lastMessagePreview: 'Looking forward to meeting everyone!'
    },
    {
      id: '2',
      offerId: 'flight-chat-offer-2',
      flightNumber: 'GDY456',
      departureLocation: 'Los Angeles (LAX)',
      arrivalLocation: 'Las Vegas (LAS)',
      departureTime: addDays(now, 14).toISOString(),
      participantCount: 6,
      unreadCount: 0,
      lastMessageTime: addDays(now, -1).toISOString(),
      lastMessagePreview: 'Does anyone need a ride from the airport?'
    }
  ];
  
  return NextResponse.json({
    success: true,
    chats: sampleChats
  });
} 