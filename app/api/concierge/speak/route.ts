import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * API route for converting text to speech using ElevenLabs API
 */
export async function POST(request: Request) {
  try {
    // Authenticate request using Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for ElevenLabs API key
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.error('ElevenLabs API key not configured');
      throw new Error('ElevenLabs API key is not set');
    }
    
    // Parse the request body
    const { text, voiceId = 'Adam' } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Limit text length to prevent abuse
    const limitedText = text.length > 500 ? text.substring(0, 500) + '...' : text;
    
    try {
      // Make API request to ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
        },
        body: JSON.stringify({
          text: limitedText,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
      
      if (!response.ok) {
        console.error('ElevenLabs API error:', response.status, response.statusText);
        throw new Error(`Text-to-speech failed: ${response.statusText}`);
      }
      
      // Get the audio data
      const audioData = await response.arrayBuffer();
      
      // Log success
      console.log(`Text-to-speech successful: "${limitedText.substring(0, 50)}..." (${audioData.byteLength} bytes)`);
      
      // Return the audio data with appropriate headers
      return new Response(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioData.byteLength.toString()
        }
      });
    } catch (error) {
      console.error('Error in ElevenLabs API call:', error);
      
      // Fall back to a simple response for testing
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using fallback audio for testing');
        
        // Generate a simple tone as fallback (a 440Hz sine wave)
        const fallbackAudio = generateFallbackAudio();
        
        return new Response(fallbackAudio, {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Length': fallbackAudio.byteLength.toString()
          }
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in /api/concierge/speak:', error);
    return NextResponse.json(
      { error: 'Text-to-speech failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Generate a simple audio fallback for testing
 * Creates a 440Hz sine wave for 1 second
 */
function generateFallbackAudio(): ArrayBuffer {
  // Parameters for WAV file
  const sampleRate = 44100;
  const seconds = 1;
  const frequency = 440; // A4 note
  
  // Calculate buffer size and create the buffer
  const numSamples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2); // 44 bytes for header + 2 bytes per sample
  const view = new DataView(buffer);
  
  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true); // Chunk size
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, 1, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true); // Sub-chunk size
  
  // Write audio data
  const volume = 0.5;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * 32767;
    view.setInt16(44 + i * 2, sample, true);
  }
  
  return buffer;
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
} 