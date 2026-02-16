/**
 * AI Agent Service using LangGraph
 * 
 * Creates a conversational agent that can help with:
 * - Building diagrams
 * - Debugging models
 * - Creating formulas
 * - Analyzing structure
 */

import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, START, END, MessagesAnnotation, type LangGraphRunnableConfig } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

// Environment configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// LLM Model from environment (or default)
const DEFAULT_MODEL = process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet';

// LangSmith tracing configuration (automatically enabled if env vars are set)
// LANGSMITH_TRACING=true
// LANGSMITH_API_KEY=<your_key>
// LANGSMITH_PROJECT=<your_project>
// LANGSMITH_ENDPOINT=https://api.smith.langchain.com

/**
 * Agent State Schema
 */
const AgentState = MessagesAnnotation;

/**
 * Create LLM instance configured for OpenRouter
 */
export function createLLM(model: string = DEFAULT_MODEL) {
  return new ChatOpenAI({
    model,
    temperature: 0.7,
    streaming: true,
    configuration: {
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
    },
  });
}

/**
 * System prompt for the Insight Sorcerer AI assistant
 */
const SYSTEM_PROMPT = `Ты AI ассистент для Insight Sorcerer - платформы для создания Stock & Flow моделей (похожей на Insight Maker).

Твои основные задачи:
1. **Помощь в построении схем** - объяснять как создавать Stock, Flow, Variable, Converter элементы
2. **Дебаг моделей** - находить ошибки в логике и связях
3. **Создание формул** - помогать писать математические формулы для элементов
4. **Анализ структуры** - давать советы по улучшению модели

Основные элементы системы:
- **Stock** (Запас) - накопитель, интегрирует входящие/исходящие потоки
- **Flow** (Поток) - изменяет значение Stock со временем
- **Variable** (Переменная) - хранит значение или формулу
- **Converter** (Конвертер) - преобразует входные значения

**ВАЖНО:**
- Если получаешь контекст диаграммы в сообщениях (помечен как [КОНТЕКСТ ДИАГРАММЫ]), используй его для анализа
- Обращай внимание на структуру модели, связи между элементами, формулы
- Давай конкретные советы основываясь на реальной структуре диаграммы пользователя
- Если видишь проблемы в модели (отсутствие связей, неправильные формулы), укажи на них

Отвечай кратко, по делу, на русском языке. Используй эмодзи для наглядности.`;

/**
 * Agent node - processes user messages with streaming
 */
async function agentNode(
  state: typeof AgentState.State,
  config: LangGraphRunnableConfig
) {
  const llm = createLLM();
  
  // Add system message at the beginning
  const messages: BaseMessage[] = [
    new HumanMessage(SYSTEM_PROMPT),
    ...state.messages
  ];

  // Stream the response
  const stream = await llm.stream(messages);
  
  let fullResponse = '';
  for await (const chunk of stream) {
    const content = chunk.content as string;
    if (content) {
      fullResponse += content;
      // Stream to WebSocket using custom writer
      config.writer?.({ type: 'token', content });
    }
  }

  return {
    messages: [new AIMessage(fullResponse)],
  };
}

/**
 * Create the agent graph
 */
export function createAgentGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode('agent', agentNode)
    .addEdge(START, 'agent')
    .addEdge('agent', END);

  return workflow.compile();
}

/**
 * Process a chat message with streaming
 */
export async function processChatMessage(
  message: string,
  history: BaseMessage[] = [],
  onToken?: (token: string) => void
): Promise<void> {
  const graph = createAgentGraph();
  
  const newMessage = new HumanMessage(message);
  const messages = [...history, newMessage];

  // Stream the response with custom mode
  for await (const chunk of await graph.stream(
    { messages },
    { streamMode: 'custom' }
  )) {
    // Chunk contains data from config.writer
    if (chunk && typeof chunk === 'object' && 'type' in chunk && chunk.type === 'token') {
      const content = (chunk as { content: string }).content;
      if (content) {
        onToken?.(content);
      }
    }
  }
}

/**
 * Get available models from OpenRouter (mock for now)
 */
export function getAvailableModels() {
  return [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  ];
}

