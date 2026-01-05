import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { transcribeRoute } from './routes/transcribe';
import { generateRoute } from './routes/generate';

const PORT = process.env.PORT || 4000;

const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }))
  .get('/', () => ({
    status: 'ok',
    message: 'Speech-to-Jira API',
    endpoints: {
      transcribe: 'POST /api/transcribe',
      generate: 'POST /api/generate'
    }
  }))
  .get('/health', () => ({ status: 'healthy', timestamp: new Date().toISOString() }))
  .use(transcribeRoute)
  .use(generateRoute)
  .listen(PORT);

console.log(`Backend running at http://localhost:${PORT}`);
