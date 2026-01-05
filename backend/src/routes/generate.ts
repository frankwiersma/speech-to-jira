import { Elysia, t } from 'elysia';
import { generateTickets, type JiraTicket } from '../services/ticketGenerator';

export const generateRoute = new Elysia({ prefix: '/api' })
  .post('/generate', async ({ body, set }) => {
    try {
      const { transcript } = body as { transcript?: string };

      if (!transcript || typeof transcript !== 'string') {
        set.status = 400;
        return { error: 'Transcript is required' };
      }

      if (transcript.length < 10) {
        set.status = 400;
        return { error: 'Transcript too short for meaningful analysis' };
      }

      console.log(`Generating tickets from transcript (${transcript.length} chars)`);

      const result = await generateTickets(transcript);

      return {
        success: true,
        tickets: result.tickets,
        summary: result.summary,
        count: result.tickets.length,
      };
    } catch (error) {
      console.error('Generation error:', error);
      set.status = 500;
      return {
        error: 'Ticket generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, {
    body: t.Object({
      transcript: t.String(),
    }),
  })

  // Combined endpoint: transcribe and generate in one call
  .post('/process', async ({ body, set }) => {
    try {
      const formData = body as { audio?: File };

      if (!formData.audio) {
        set.status = 400;
        return { error: 'No audio file provided' };
      }

      const file = formData.audio;
      console.log(`Processing: ${file.name}`);

      // Import transcribe function
      const { transcribeAudio } = await import('../services/deepgram');

      // Step 1: Transcribe
      const audioBuffer = await file.arrayBuffer();
      const transcription = await transcribeAudio(audioBuffer, file.type || 'audio/mpeg');

      // Step 2: Generate tickets
      const result = await generateTickets(transcription.transcript);

      return {
        success: true,
        transcript: transcription.transcript,
        duration: transcription.duration,
        tickets: result.tickets,
        summary: result.summary,
        count: result.tickets.length,
      };
    } catch (error) {
      console.error('Processing error:', error);
      set.status = 500;
      return {
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
