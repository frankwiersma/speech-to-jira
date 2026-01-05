import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
});

const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5';

export interface JiraTicket {
  id: string;
  type: 'Story' | 'Task';
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  source?: {
    timestamp?: string;
    fragment?: string;
  };
}

interface GenerationResult {
  tickets: JiraTicket[];
  summary: string;
}

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
  - timestamp: De timestamp [MM:SS] uit het transcript waar dit item besproken werd (gebruik de echte timestamp uit het transcript!)
  - fragment: Relevant citaat uit het transcript

Richtlijnen:
- Schrijf in het Nederlands
- Gebruik actieve taal
- Stories beginnen met "Als [rol] wil ik [actie] zodat [waarde]"
- Tasks zijn concrete, afgebakende werkitems
- Wees specifiek en vermijd vage beschrijvingen
- Groepeer gerelateerde items logisch
- BELANGRIJK: Gebruik de echte timestamps uit het transcript voor de source.timestamp veld

Geef je antwoord als JSON in dit exacte formaat:
{
  "tickets": [...],
  "summary": "Korte samenvatting van de sessie"
}`;

export async function generateTickets(transcript: string): Promise<GenerationResult> {
  if (!process.env.AZURE_OPENAI_API_KEY) {
    throw new Error('AZURE_OPENAI_API_KEY not configured');
  }

  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analyseer dit transcript van een refinement sessie en genereer Jira tickets:\n\n${transcript}` }
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Azure OpenAI');
  }

  try {
    const result = JSON.parse(content) as GenerationResult;

    // Add unique IDs if not present
    result.tickets = result.tickets.map((ticket, index) => ({
      ...ticket,
      id: ticket.id || `TICKET-${Date.now()}-${index + 1}`,
    }));

    return result;
  } catch (e) {
    throw new Error(`Failed to parse AI response: ${e}`);
  }
}
