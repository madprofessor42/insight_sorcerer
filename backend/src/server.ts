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
    - WS   /api/ai/chat - Real-time чат с AI
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

