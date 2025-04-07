import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs API key and voice ID
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice

/**
 * Narrate text using ElevenLabs API
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required for narration' }, { status: 400 });
    }
    
    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured, using fallback TTS');
      return handleFallbackTTS(text);
    }
    
    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });
    
    if (!response.ok) {
      console.error('Error from ElevenLabs:', await response.text());
      return handleFallbackTTS(text);
    }
    
    // Get the audio content
    const audioData = await response.arrayBuffer();
    
    // Return audio
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in narration API:', error);
    return NextResponse.json(
      { error: 'Failed to generate narration', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Fallback to browser's Web Speech API if ElevenLabs is not available
 */
async function handleFallbackTTS(text: string): Promise<NextResponse> {
  try {
    // For fallback, we'll use a simple text response that the client can use with the browser's TTS
    return NextResponse.json({
      text,
      fallback: true,
      message: 'Using fallback TTS as ElevenLabs API key is not configured',
    });
  } catch (error) {
    console.error('Error in fallback TTS:', error);
    return NextResponse.json(
      { error: 'Failed to generate fallback narration' },
      { status: 500 }
    );
  }
} 