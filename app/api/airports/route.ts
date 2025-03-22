import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('airports')
    .select('code, name, city, country')
    .order('city', { ascending: true });
  
  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch airports' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(data);
} 