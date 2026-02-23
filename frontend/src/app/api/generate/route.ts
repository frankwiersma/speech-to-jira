import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

export const maxDuration = 120;

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
    // BYOK: accept keys from headers
    const azureKey = req.headers.get('x-azure-key') || process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = req.headers.get('x-azure-endpoint') || process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = req.headers.get('x-azure-deployment') || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    const apiVersion = req.headers.get('x-azure-version') || process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';

    if (!azureKey || !azureEndpoint) {
      return NextResponse.json(
        { error: 'Azure OpenAI credentials required. Add them in Settings.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { transcript } = body as { transcript?: string };

    if (!transcript || typeof transcript !== 'string' || transcript.length < 10) {
      return NextResponse.json({ error: 'Transcript too short or missing' }, { status: 400 });
    }

    const client = new AzureOpenAI({
      endpoint: azureEndpoint,
      apiKey: azureKey,
      apiVersion,
    });

    const response = await client.chat.completions.create({
      model: azureDeployment,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyseer dit transcript van een refinement sessie en genereer Jira tickets:\n\n${transcript}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from Azure OpenAI' }, { status: 502 });
    }

    const result = JSON.parse(content) as { tickets: unknown[]; summary: string };
    result.tickets = result.tickets.map((ticket: any, index: number) => ({
      ...ticket,
      id: ticket.id || `TICKET-${Date.now()}-${index + 1}`,
    }));

    return NextResponse.json({
      success: true,
      tickets: result.tickets,
      summary: result.summary,
      count: result.tickets.length,
    });
  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ticket generation failed' },
      { status: 500 }
    );
  }
}
