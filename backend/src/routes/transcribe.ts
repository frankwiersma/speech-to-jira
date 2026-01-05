import { Elysia } from 'elysia';
import { transcribeAudio } from '../services/deepgram';

const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/m4a',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
];

export const transcribeRoute = new Elysia({ prefix: '/api' })
  .post('/transcribe', async ({ body, set }) => {
    try {
      // Handle multipart form data
      const formData = body as { audio?: File };

      if (!formData.audio) {
        set.status = 400;
        return { error: 'No audio file provided' };
      }

      const file = formData.audio;

      // Validate file type
      const mimeType = file.type || 'audio/mpeg';
      if (!ALLOWED_MIME_TYPES.some(t => mimeType.includes(t.split('/')[1]))) {
        set.status = 400;
        return { error: `Unsupported audio format: ${mimeType}. Supported: mp3, wav, m4a, webm` };
      }

      // Validate file size (max 100MB)
      const MAX_SIZE = 100 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        set.status = 400;
        return { error: 'File too large. Maximum size is 100MB' };
      }

      console.log(`Transcribing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, ${mimeType})`);

      const audioBuffer = await file.arrayBuffer();
      const result = await transcribeAudio(audioBuffer, mimeType);

      return {
        success: true,
        transcript: result.transcript,
        duration: result.duration,
        confidence: result.confidence,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      set.status = 500;
      return {
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
