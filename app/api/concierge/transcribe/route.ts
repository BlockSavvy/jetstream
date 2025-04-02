import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

/**
 * API route for transcribing audio to text using OpenAI Whisper API
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
    
    // Parse the form data to get the audio file
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert the audio file to an ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save the file temporarily to disk if needed
    // OpenAI API can accept the file directly in the FormData
    try {
      // Ensure temp directory exists
      await mkdir('tmp', { recursive: true });
      
      // Save the file with a unique name
      const fileName = `tmp/audio-${uuidv4()}.webm`;
      await writeFile(fileName, buffer);
      
      // Create a form data object for OpenAI API
      const openaiFormData = new FormData();
      openaiFormData.append('file', new File([buffer], 'audio.webm', { type: audioFile.type }));
      openaiFormData.append('model', 'whisper-1');
      
      // Make API request to OpenAI Whisper
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: openaiFormData
      });
      
      if (!response.ok) {
        console.error('Whisper API error:', response.status, response.statusText);
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Transcription successful:', data.text.substring(0, 100) + '...');
      
      // Return the transcribed text
      return NextResponse.json({ text: data.text });
    } catch (error) {
      console.error('Error in audio processing:', error);
      
      // Fall back to a stub response for testing if needed
      if (process.env.NODE_ENV === 'development') {
        console.warn('Returning stub response for testing');
        return NextResponse.json({ 
          text: "This is a fallback transcription for testing purposes. The transcription service is not fully configured." 
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in /api/concierge/transcribe:', error);
    return NextResponse.json(
      { error: 'Transcription failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 