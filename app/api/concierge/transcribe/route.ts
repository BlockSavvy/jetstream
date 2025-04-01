import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

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

    // Check if OpenAI client is available
    if (!openai || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API is not configured' },
        { status: 503 }
      );
    }

    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Get audio file bytes
    const audioBytes = await audioFile.arrayBuffer();
    
    // OpenAI's Whisper API requires a File object
    // We need to convert the audio data to a format OpenAI can use
    const fileBlob = new Blob([audioBytes], { type: audioFile.type });
    
    // Create a File object from the Blob
    const file = new File([fileBlob], 'audio.webm', { type: audioFile.type });

    // Call the OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // You can make this configurable
    });

    return NextResponse.json({
      text: transcription.text
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 