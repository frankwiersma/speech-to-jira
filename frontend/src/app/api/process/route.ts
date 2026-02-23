import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

export const maxDuration = 120;

const DEEPGRAM_EU_ENDPOINT = 'https://api.eu.deepgram.com/v1/listen';

const SYSTEM_PROMPT = `Je bent een ervaren Agile coach en Product Owner die gesprekken uit refinement sessies analyseert en omzet naar gestructureerde Jira tickets.

Het transcript bevat timestamps in het formaat [MM:SS] aan het begin van elke zin/utterance.

Analyseer het transcript en identificeer:
1. User Stories: Functionele requirements vanuit gebruikersperspectief
2. Tasks: Technische taken of werk items

Voor elk ticket genereer je:
- type: "Story" of "Task"
- title: Korte, duidelijke titel (max 80 karakters)
- description: Gedetailleerde beschrijving van het werk
- acceptanceCriteria: Array van acceptance criteria (voor Stories)
- source: Object met:
  - timestamp: De timestamp [MM:SS] uit het transcript waar dit item besproken werd
  - fragment: Relevant citaat uit het transcript

Richtlijnen:
- Schrijf in het Nederlands
- Gebruik actieve taal
- Stories beginnen met "Als [rol] wil ik [actie] zodat [waarde]"
- Tasks zijn concrete, afgebakende werkitems
- Wees specifiek en vermijd vage beschrijvingen
- BELANGRIJK: Gebruik de echte timestamps uit het transcript

Geef je antwoord als JSON in dit exacte formaat:
{
  "tickets": [...],
  "summary": "Korte samenvatting van de sessie"
}`;

export async function POST(req: NextRequest) {
  try {
    const deepgramKey = req.headers.get('x-deepgram-key') || process.env.DEEPGRAM_API_KEY;
    const azureKey = req.headers.get('x-azure-key') || process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = req.headers.get('x-azure-endpoint') || process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = req.headers.get('x-azure-deployment') || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    const apiVersion = req.headers.get('x-azure-version') || process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';

    if (!deepgramKey) {
      return NextResponse.json(
        { error: 'Deepgram API key required. Add it in Settings.' },
        { status: 401 }
      );
    }
    if (!azureKey || !azureEndpoint) {
      return NextResponse.json(
        { error: 'Azure OpenAI credentials required. Add them in Settings.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // ── Step 1: Transcribe ──────────────────────────────────────────────────
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
    const dgResponse = await fetch(`${DEEPGRAM_EU_ENDPOINT}?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramKey}`,
        'Content-Type': audioFile.type || 'audio/mpeg',
      },
      body: audioBuffer,
    });

    if (!dgResponse.ok) {
      const err = await dgResponse.text();
      return NextResponse.json({ error: `Deepgram error: ${dgResponse.status} — ${err}` }, { status: 502 });
    }

    const dgData = await dgResponse.json();
    const alternative = dgData.results?.channels?.[0]?.alternatives?.[0];
    if (!alternative) {
      return NextResponse.json({ error: 'No transcription result from Deepgram' }, { status: 502 });
    }

    const utterances: Array<{ start: number; transcript: string }> = dgData.results?.utterances || [];
    const timestampedTranscript =
      utterances.length > 0
        ? utterances
            .map((u) => {
              const mins = Math.floor(u.start / 60);
              const secs = Math.floor(u.start % 60);
              return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}] ${u.transcript}`;
            })
            .join('\n')
        : alternative.transcript;

    // ── Step 2: Generate tickets ────────────────────────────────────────────
    const client = new AzureOpenAI({
      endpoint: azureEndpoint,
      apiKey: azureKey,
      apiVersion,
    });

    const aiResponse = await client.chat.completions.create({
      model: azureDeployment,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyseer dit transcript van een refinement sessie en genereer Jira tickets:\n\n${timestampedTranscript}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = aiResponse.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from Azure OpenAI' }, { status: 502 });
    }

    const result = JSON.parse(content) as { tickets: any[]; summary: string };
    result.tickets = result.tickets.map((ticket: any, index: number) => ({
      ...ticket,
      id: ticket.id || `TICKET-${Date.now()}-${index + 1}`,
    }));

    return NextResponse.json({
      success: true,
      transcript: alternative.transcript,
      duration: dgData.metadata?.duration,
      tickets: result.tickets,
      summary: result.summary,
      count: result.tickets.length,
    });
  } catch (err) {
    console.error('Process error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
