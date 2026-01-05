const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_EU_ENDPOINT = 'https://api.eu.deepgram.com/v1/listen';

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
  };
  metadata: {
    duration: number;
    channels: number;
  };
}

interface TranscriptionResult {
  transcript: string;
  duration: number;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
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

  return {
    transcript: alternative.transcript,
    duration: data.metadata.duration,
    confidence: alternative.confidence,
    words: alternative.words,
  };
}
