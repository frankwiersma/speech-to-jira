const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_EU_ENDPOINT = 'https://api.eu.deepgram.com/v1/listen';

interface Utterance {
  start: number;
  end: number;
  transcript: string;
  speaker?: number;
}

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words?: Array<{
          word: string;
          start: number;
          end: number;
        }>;
      }>;
    }>;
    utterances?: Utterance[];
  };
  metadata: {
    duration: number;
    channels: number;
  };
}

interface TranscriptionResult {
  transcript: string;
  timestampedTranscript: string;
  duration: number;
  confidence: number;
  utterances?: Utterance[];
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function transcribeAudio(audioBuffer: ArrayBuffer, mimeType: string): Promise<TranscriptionResult> {
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const params = new URLSearchParams({
    model: 'nova-2',
    language: 'nl',  // Dutch for refinement sessions
    smart_format: 'true',
    punctuate: 'true',
    paragraphs: 'true',
    diarize: 'true',  // Speaker detection
    utterances: 'true',
  });

  const response = await fetch(`${DEEPGRAM_EU_ENDPOINT}?${params}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${response.status} - ${error}`);
  }

  const data: DeepgramResponse = await response.json();

  const channel = data.results.channels[0];
  const alternative = channel?.alternatives[0];

  if (!alternative) {
    throw new Error('No transcription result received');
  }

  const utterances = data.results.utterances || [];

  // Build timestamped transcript from utterances
  const timestampedTranscript = utterances.length > 0
    ? utterances.map(u => `[${formatTimestamp(u.start)}] ${u.transcript}`).join('\n')
    : alternative.transcript;

  return {
    transcript: alternative.transcript,
    timestampedTranscript,
    duration: data.metadata.duration,
    confidence: alternative.confidence,
    utterances,
  };
}
