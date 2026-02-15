import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { aiRoutes } from './routes/ai.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS plugin
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});

// Register WebSocket plugin
await fastify.register(websocket);

// Health check endpoint
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'insight-sorcerer-backend'
  };
});

// Register AI routes
await fastify.register(aiRoutes, { prefix: '/api/ai' });

// Start server
const start = async () => {
  try {
    // Check for required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('⚠️  WARNING: OPENROUTER_API_KEY not set in environment variables!');
      console.warn('   AI chat will not work without it.');
      console.warn('   Please set it in backend/.env file');
    }
    
    if (!process.env.LLM_MODEL) {
      console.warn('⚠️  INFO: LLM_MODEL not set, using default: anthropic/claude-3.5-sonnet');
    }

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`
    🚀 Insight Sorcerer Backend Server Started!
    
    📍 Server: http://localhost:${port}
    🏥 Health: http://localhost:${port}/health
    🤖 AI API: http://localhost:${port}/api/ai
    💬 AI Chat WebSocket: ws://localhost:${port}/api/ai/chat
    
    Available AI endpoints:
    - POST /api/ai/query - Универсальный запрос к AI
    - POST /api/ai/stream - Стриминг ответов AI
    - GET  /api/ai/capabilities - Список возможностей AI
    - WS   /api/ai/chat - Real-time чат с AI (LangGraph Agent)
    
    Environment:
    - OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Not configured'}
    - LLM Model: ${process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet (default)'}
    - LangSmith Tracing: ${process.env.LANGSMITH_TRACING === 'true' ? '✅ Enabled' : '⚪ Disabled'}
    - LangSmith Project: ${process.env.LANGSMITH_PROJECT || 'N/A'}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

