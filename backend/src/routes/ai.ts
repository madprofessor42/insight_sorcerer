import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { AIQueryRequest, AIQueryResponse } from '../types/ai.js';
import { processChatMessage, generateDiagramModificationsWithValidation } from '../services/ai-agent.js';
import { HumanMessage, AIMessage, type BaseMessage } from '@langchain/core/messages';

export const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  
  // Универсальный endpoint для работы с AI (REST API)
  fastify.post('/query', async (request, reply) => {
    const body = request.body as AIQueryRequest;

    try {
      fastify.log.info({ action: body.context?.action }, 'AI query received');

      // TODO: Интеграция с LLM
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockResponse: AIQueryResponse = {
        success: true,
        message: `Получен ваш вопрос: "${body.message}"`,
        suggestions: [
          'Добавьте Stock node для хранения значения',
          'Соедините Variable с Flow через влияние',
          'Проверьте формулу в converter node',
        ],
        timestamp: new Date().toISOString(),
      };

      return mockResponse;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to process AI query',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Endpoint для стриминга ответов (для длинных ответов)
  fastify.post('/stream', async (_request, reply) => {
    try {
      reply.type('application/json');
      
      return {
        success: true,
        message: 'Streaming endpoint (to be implemented)',
        note: 'Будет использоваться для длинных ответов AI',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to start AI stream',
      });
    }
  });

  // Получить доступные AI функции/возможности
  fastify.get('/capabilities', async () => {
    return {
      success: true,
      capabilities: [
        {
          id: 'build',
          name: 'Помощь в построении схемы',
          description: 'AI помогает создавать и структурировать диаграммы',
          status: 'planned',
        },
        {
          id: 'debug',
          name: 'Дебаг схемы',
          description: 'Анализ ошибок и проблем в диаграмме',
          status: 'planned',
        },
        {
          id: 'formula',
          name: 'Помощь с формулами',
          description: 'Создание и исправление формул',
          status: 'planned',
        },
        {
          id: 'analyze',
          name: 'Анализ модели',
          description: 'Глубокий анализ логики и структуры модели',
          status: 'planned',
        },
        {
          id: 'suggest',
          name: 'Умные предложения',
          description: 'Контекстные подсказки и рекомендации',
          status: 'planned',
        },
      ],
    };
  });

  // WebSocket endpoint для real-time чата с AI
  fastify.get('/chat', { websocket: true }, (socket) => {
    const clientId = Math.random().toString(36).substring(7);
    fastify.log.info({ clientId }, 'AI Chat WebSocket connection established');

    // Store conversation history for this WebSocket session
    // NOTE: История уничтожается при закрытии соединения - это ожидаемое поведение
    // Каждое новое подключение = новая сессия с пустой историей
    const conversationHistory: BaseMessage[] = [];

    // Heartbeat interval (ping каждые 30 секунд)
    const heartbeatInterval = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    // ВАЖНО: Все event handlers устанавливаются синхронно!
    // Это критично для избежания потери сообщений
    
    socket.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString()) as {
          type: 'message' | 'context_update' | 'ping' | 'suggest_modifications';
          message?: string;
          context?: any;
        };

        fastify.log.info({ type: data.type, clientId }, 'Received WebSocket message');

        // Обработка ping от клиента
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (data.type === 'message' && data.message) {
          // Send "thinking" indicator
          socket.send(JSON.stringify({
            type: 'thinking',
            timestamp: new Date().toISOString(),
          }));

          try {
            let fullResponse = '';
            let tokenCount = 0;
            
            // Process message with AI agent using streaming
            await processChatMessage(
              data.message,
              conversationHistory,
              (token: string) => {
                // Stream each token to the client
                if (socket.readyState === socket.OPEN) {
                  socket.send(JSON.stringify({
                    type: 'token',
                    content: token,
                    timestamp: new Date().toISOString(),
                  }));
                  fullResponse += token;
                  tokenCount++;
                }
              }
            );

            // Update conversation history
            conversationHistory.push(new HumanMessage(data.message));
            conversationHistory.push(new AIMessage(fullResponse));

            // Send completion signal
            socket.send(JSON.stringify({
              type: 'message_complete',
              timestamp: new Date().toISOString(),
            }));

            fastify.log.info({ 
              clientId, 
              messageLength: fullResponse.length,
              tokenCount,
              historySize: conversationHistory.length 
            }, 'AI response sent');
          } catch (aiError) {
            fastify.log.error({ clientId, error: aiError }, 'AI processing error');
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Ошибка при обработке сообщения AI',
              error: aiError instanceof Error ? aiError.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            }));
          }
        } else if (data.type === 'context_update') {
          // Обновление контекста (текущая диаграмма, выбранный узел и т.д.)
          fastify.log.info({ 
            clientId, 
            contextSize: data.context ? JSON.stringify(data.context).length : 0,
            hasFormattedContext: Boolean(data.context?.formattedContext)
          }, 'Context updated');
          
          // Add formatted diagram context to conversation history
          if (data.context && data.context.formattedContext) {
            const contextMessage = `\n[КОНТЕКСТ ДИАГРАММЫ]\n${data.context.formattedContext}\n[КОНЕЦ КОНТЕКСТА]\n\nИспользуй эту информацию о текущей диаграмме пользователя для более точных ответов.`;
            conversationHistory.push(new HumanMessage(contextMessage));
            
            fastify.log.info({ 
              clientId, 
              totalNodes: data.context.diagram?.totalNodes || 0,
              totalLinks: data.context.diagram?.totalLinks || 0
            }, 'Diagram context added to conversation');
          }

          socket.send(JSON.stringify({
            type: 'context_received',
            timestamp: new Date().toISOString(),
          }));
        } else if (data.type === 'suggest_modifications') {
          // Generate diagram modification suggestions
          fastify.log.info({ clientId }, 'Generating diagram modifications');
          
          try {
            if (!data.message) {
              throw new Error('User request message is required');
            }

            // Send "thinking" indicator
            socket.send(JSON.stringify({
              type: 'thinking',
              message: 'Анализирую диаграмму и генерирую предложения...',
              timestamp: new Date().toISOString(),
            }));

            // Generate modifications with validation feedback loop
            // The function will extract diagram context from conversation history internally
            const modifications = await generateDiagramModificationsWithValidation(
              data.message,
              conversationHistory
            );

            // Send modifications to client
            socket.send(JSON.stringify({
              type: 'modifications_proposed',
              modifications,
              timestamp: new Date().toISOString(),
            }));

            fastify.log.info({ 
              clientId, 
              operationsCount: modifications.operations.length 
            }, 'Diagram modifications generated and sent');

            // Add to conversation history
            conversationHistory.push(new HumanMessage(data.message));
            conversationHistory.push(new AIMessage(
              `Я предложил ${modifications.operations.length} изменений в диаграмме: ${modifications.reasoning}`
            ));
          } catch (modError) {
            fastify.log.error({ clientId, error: modError }, 'Modification generation error');
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Не удалось сгенерировать предложения по изменению диаграммы',
              error: modError instanceof Error ? modError.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            }));
          }
        }
      } catch (error) {
        fastify.log.error(error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    });

    socket.on('close', (code: number, reason: Buffer) => {
      fastify.log.info({ clientId, code, reason: reason.toString() }, 'AI Chat WebSocket connection closed');
      clearInterval(heartbeatInterval);
    });

    socket.on('error', (error: Error) => {
      fastify.log.error({ clientId, error }, 'WebSocket error');
      clearInterval(heartbeatInterval);
    });

    // Отправляем приветствие
    socket.send(JSON.stringify({
      type: 'welcome',
      message: '👋 Привет! Я AI ассистент Insight Sorcerer. Чем могу помочь?',
      timestamp: new Date().toISOString(),
    }));
  });
};
