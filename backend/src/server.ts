import Fastify from 'fastify';
import cors from '@fastify/cors';

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

// Health check endpoint
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'insight-sorcerer-backend'
  };
});

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
    
    Ready to add your routes!
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

