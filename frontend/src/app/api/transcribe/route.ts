import { NextRequest, NextResponse } from 'next/server';

const DEEPGRAM_EU_ENDPOINT = 'https://api.eu.deepgram.com/v1/listen';

const ALLOWED_MIME_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
  'audio/x-wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/webm',
];

export const maxDuration = 120; // Netlify function timeout

export async function POST(req: NextRequest) {
  try {
    // BYOK: accept key from header or form field
    const deepgramKey =
      req.headers.get('x-deepgram-key') ||
      process.env.DEEPGRAM_API_KEY;

    if (!deepgramKey) {
      return NextResponse.json(
        { error: 'Deepgram API key required. Add it in Settings.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const mimeType = audioFile.type || 'audio/mpeg';
    if (!ALLOWED_MIME_TYPES.some(t => mimeType.includes(t.split('/')[1]))) {
      return NextResponse.json(
        { error: `Unsupported format: ${mimeType}. Use MP3, WAV, M4A, or WebM.` },
        { status: 400 }
      );
    }

    if (audioFile.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
    }

    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'nl',
      smart_format: 'true',
      punctuate: 'true',
      paragraphs: 'true',
      diarize: 'true',
      utterances: 'true',
    });

    const audioBuffer = await audioFile.arrayBuffer();
    const response = await fetch(`${DEEPGRAM_EU_ENDPOINT}?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramKey}`,
        'Content-Type': mimeType,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Deepgram error: ${response.status} — ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const channel = data.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];

    if (!alternative) {
      return NextResponse.json({ error: 'No transcription result' }, { status: 502 });
    }

    const utterances: Array<{ start: number; end: number; transcript: string; speaker?: number }> =
      data.results?.utterances || [];

    const timestampedTranscript =
      utterances.length > 0
        ? utterances
            .map((u) => {
              const mins = Math.floor(u.start / 60);
              const secs = Math.floor(u.start % 60);
              const ts = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              return `[${ts}] ${u.transcript}`;
            })
            .join('\n')
        : alternative.transcript;

    return NextResponse.json({
      success: true,
      transcript: alternative.transcript,
      timestampedTranscript,
      duration: data.metadata?.duration,
      confidence: alternative.confidence,
    });
  } catch (err) {
    console.error('Transcription error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
