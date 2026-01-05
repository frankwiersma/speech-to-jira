/**
 * Generate demo audio file using Deepgram Aura TTS
 * Run with: bun run scripts/generate-demo-audio.ts
 */

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.error('DEEPGRAM_API_KEY environment variable is required');
  process.exit(1);
}
const OUTPUT_PATH = './frontend/public/demo-refinement.mp3';

// Dutch refinement session script - split into chunks (max 2000 chars each)
const SCRIPT_CHUNKS = [
  `Oké, laten we beginnen met de refinement voor de nieuwe klantenportaal functionaliteit. Eerste punt is de authenticatie module. Gebruikers moeten kunnen inloggen met email en wachtwoord. We voegen ook single sign-on toe via Microsoft Entra ID voor zakelijke klanten. De user story is: Als zakelijke gebruiker wil ik kunnen inloggen met mijn bedrijfsaccount zodat ik geen apart wachtwoord hoef te onthouden. Acceptance criteria: de login pagina toont een Microsoft login optie, na authenticatie wordt de gebruiker doorgestuurd naar het dashboard, bij fouten krijgt de gebruiker een duidelijke melding. Er is ook een technische taak nodig voor de Microsoft Entra ID integratie en OAuth configuratie.`,

  `Tweede onderwerp is het dashboard. Product owner Lisa wil dat klanten een overzicht zien van recente orders en openstaande facturen. We gebruiken een widget-based layout. User story: Als klant wil ik op mijn dashboard mijn laatste vijf orders en openstaande facturen zien voor snel inzicht in mijn account. Acceptance criteria: dashboard laadt binnen drie seconden, orders tonen ordernummer datum en status, facturen tonen nummer bedrag en vervaldatum. Taak: API endpoints bouwen voor dashboard data met paginering.`,

  `Derde punt is notificaties. Klanten willen email notificaties bij order bevestiging en factuur herinneringen. User story: Als klant wil ik email notificaties ontvangen bij belangrijke events zodat ik op de hoogte blijf. Criteria: notificaties binnen vijf minuten, emails met relevante details en link naar portaal, gebruikers kunnen voorkeuren beheren. Taak: SendGrid integratie en email templates aanmaken.`,

  `Tot slot de zoekfunctionaliteit. Klanten moeten kunnen zoeken in orders en facturen via Elasticsearch. User story: Als klant wil ik kunnen zoeken in mijn orders en facturen om snel items te vinden. Criteria: resultaten binnen één seconde, zoeken op ordernummer productnaam en factuurnummer, gesorteerd op relevantie. Taak: Elasticsearch index opzetten en search API implementeren. Zijn er nog vragen? Dan sluiten we af. Sprint planning is morgen om tien uur.`
];

async function generateChunkAudio(text: string, index: number): Promise<ArrayBuffer> {
  console.log(`Generating chunk ${index + 1}/${SCRIPT_CHUNKS.length} (${text.length} chars)...`);

  const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-2-sander-nl', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram TTS error: ${response.status} - ${error}`);
  }

  return response.arrayBuffer();
}

async function generateDemoAudio() {
  console.log('Generating demo audio with Deepgram Aura TTS...');
  console.log(`Total chunks: ${SCRIPT_CHUNKS.length}`);

  const audioBuffers: ArrayBuffer[] = [];

  for (let i = 0; i < SCRIPT_CHUNKS.length; i++) {
    const buffer = await generateChunkAudio(SCRIPT_CHUNKS[i], i);
    audioBuffers.push(buffer);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Combine all audio buffers
  const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const buffer of audioBuffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  await Bun.write(OUTPUT_PATH, combined);

  const stats = await Bun.file(OUTPUT_PATH).size;
  console.log(`Demo audio saved to: ${OUTPUT_PATH}`);
  console.log(`File size: ${(stats / 1024 / 1024).toFixed(2)} MB`);
}

generateDemoAudio().catch(console.error);
