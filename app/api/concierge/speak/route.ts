import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using Supabase
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the text from the request
    const { text, voiceId } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Get ElevenLabs API key from environment variables
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json(
        { error: 'Text-to-speech service not configured' },
        { status: 503 }
      );
    }

    // Use ElevenLabs API for high-quality voice synthesis
    const voice = voiceId || 'Adam'; // Default voice
    
    // Make API request to ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Text-to-speech failed: ${response.statusText}`);
    }
    
    // Get the audio data
    const audioData = await response.arrayBuffer();
    
    // Log the voice interaction in the database
    await supabase.from('concierge_voice_sessions').insert({
      user_id: user.id,
      session_data: {
        text_input: text.substring(0, 100) + '...',
        voice_id: voice,
        audio_duration_estimate: text.length / 20, // Rough estimate: ~20 chars per second
      },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    });
    
    // Return the audio as a binary response
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 