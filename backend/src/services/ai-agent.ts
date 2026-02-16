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
import { StateGraph, START, END, MessagesAnnotation, StateSchema, type LangGraphRunnableConfig } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  DiagramModificationProposalSchema, 
  type DiagramModificationProposal
} from '../types/diagram-modifications';
import type { ValidationResult } from './diagram-validation';
import { z } from 'zod';
import { 
  CHAT_SYSTEM_PROMPT, 
  DIAGRAM_MODIFICATION_GENERATOR_PROMPT
} from './prompts';
import { validateDiagramModifications } from './diagram-validation';

// Environment configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// LLM Models from environment (or defaults)
const DEFAULT_MODEL = process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet';
const WRITER_MODEL = process.env.LLM_MODEL_WRITER || DEFAULT_MODEL;

// LangSmith tracing configuration (automatically enabled if env vars are set)
// LANGSMITH_TRACING=true
// LANGSMITH_API_KEY=<your_key>
// LANGSMITH_PROJECT=<your_project>
// LANGSMITH_ENDPOINT=https://api.smith.langchain.com

/**
 * Agent State Schema for chat
 */
const AgentState = MessagesAnnotation;

/**
 * State schema for diagram modification workflow with script validation feedback loop
 */
const DiagramModificationState = new StateSchema({
  userRequest: z.string(),
  diagramContext: z.string(),
  conversationHistory: z.array(z.any()),
  modifications: z.any().optional(), // DiagramModificationProposal
  validationResult: z.any().optional(), // ValidationResult from script
  iterationCount: z.number().default(0),
  finalModifications: z.any().optional(), // DiagramModificationProposal
});

type DiagramModificationStateType = typeof DiagramModificationState.State;

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
 * Agent node - processes user messages with streaming
 */
async function agentNode(
  state: typeof AgentState.State,
  config: LangGraphRunnableConfig
) {
  const llm = createLLM();
  
  // Add system message at the beginning
  const messages: BaseMessage[] = [
    new HumanMessage(CHAT_SYSTEM_PROMPT),
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
 * Generate diagram modification suggestions using structured output
 */
export async function generateDiagramModifications(
  userRequest: string,
  history: BaseMessage[] = []
): Promise<DiagramModificationProposal> {
  console.log('[Generator] Using LLM model:', WRITER_MODEL);

  // Prepare messages
  const messages: BaseMessage[] = [
    new HumanMessage(DIAGRAM_MODIFICATION_GENERATOR_PROMPT),
    ...history,
    new HumanMessage(`Запрос пользователя: ${userRequest}`),
  ];

  try {
    // Create LLM with structured output using Zod schema
    const llm = createLLM(WRITER_MODEL).withStructuredOutput(DiagramModificationProposalSchema, {
      name: 'diagram_modifications',
    });
    
    const result = await llm.invoke(messages);
    
    return result;
  } catch (error) {
    console.error('Error generating diagram modifications:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    // Re-throw with more context
    throw new Error(`Failed to generate diagram modifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate proposed diagram modifications using deterministic validation script
 * Checks: link types, node existence, orphan nodes, required fields, operation order
 */
function validateModificationsWithScript(
  diagramContext: string,
  proposedModifications: DiagramModificationProposal
): ValidationResult {
  console.log('[Script Validator] Starting validation...');
  
  try {
    const result = validateDiagramModifications(diagramContext, proposedModifications);
    
    console.log('[Script Validator] Validation result:', {
      isValid: result.isValid,
      issuesCount: result.issues.length,
    });
    
    return result;
  } catch (error) {
    console.error('[Script Validator] Validation error:', error);
    // If validation fails, return error
    return {
      isValid: false,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}


/**
 * Generator Node: Generate diagram modifications with script validation feedback support
 */
async function generatorNode(state: DiagramModificationStateType): Promise<Partial<DiagramModificationStateType>> {
  console.log(`[Generator] Iteration ${state.iterationCount + 1}: Generating modifications...`);
  
  // If we have validation feedback with issues, add it to the conversation
  const conversationWithFeedback = [...(state.conversationHistory as BaseMessage[])];
  
  // Check for feedback from Script Validator
  if (state.validationResult && !state.validationResult.isValid && state.iterationCount > 0) {
    console.log('[Generator] Adding validation feedback to prompt');
    const feedbackMessage = `
ВАЖНО: Предыдущая попытка содержала ошибки валидации. Исправь их!

ОШИБКИ ВАЛИДАЦИИ:
${state.validationResult.issues.map((issue: string, i: number) => `${i + 1}. ${issue}`).join('\n')}

Пожалуйста, исправь эти ошибки и предложи корректные изменения.
`;
    conversationWithFeedback.push(new HumanMessage(feedbackMessage));
  }
  
  // Generate modifications using LLM (with or without feedback)
  const modifications = await generateDiagramModifications(
    state.userRequest,
    conversationWithFeedback
  );
  
  console.log('[Generator] Generated modifications:', {
    operationsCount: modifications.operations.length,
    reasoning: modifications.reasoning.substring(0, 100) + '...',
  });
  
  return {
    modifications,
    iterationCount: state.iterationCount + 1,
  };
}

/**
 * Script Validator Node: Validate diagram modifications using deterministic rules
 * Validates technical rules: link types, node existence, orphan nodes, required fields, etc.
 */
function scriptValidatorNode(state: DiagramModificationStateType): Partial<DiagramModificationStateType> {
  console.log(`[Script Validator] Iteration ${state.iterationCount}: Validating...`);
  
  if (!state.modifications) {
    throw new Error('No modifications to validate');
  }
  
  const validation = validateModificationsWithScript(state.diagramContext, state.modifications);
  
  console.log('[Script Validator] Validation result:', {
    isValid: validation.isValid,
    issuesCount: validation.issues.length,
    issues: validation.issues,
  });
  
  // If valid, set finalModifications
  if (validation.isValid) {
    return {
      validationResult: validation,
      finalModifications: state.modifications,
    };
  }
  
  // If invalid, return validation for feedback loop
  return {
    validationResult: validation,
  };
}


/**
 * Conditional edge router after Script Validator
 * - If validation failed -> back to generator
 * - If validation passed -> END
 */
function shouldContinue(state: DiagramModificationStateType): typeof END | 'generator' {
  const maxIterations = 3;
  
  console.log('[Router] Evaluating next step:', {
    isValid: state.validationResult?.isValid,
    iterationCount: state.iterationCount,
    maxIterations,
    issuesCount: state.validationResult?.issues?.length || 0,
  });
  
  // If valid or max iterations reached, end
  if (state.validationResult?.isValid || state.iterationCount >= maxIterations) {
    console.log('[Router] ✓ Ending workflow:', {
      isValid: state.validationResult?.isValid,
      iterationCount: state.iterationCount,
      reason: state.validationResult?.isValid ? 'Valid modifications' : 'Max iterations reached',
    });
    return END;
  }
  
  // Otherwise, go back to generator for correction
  console.log('[Router] ↻ Validation failed, routing back to generator');
  return 'generator';
}

/**
 * Extract diagram context from conversation history
 */
function extractDiagramContextFromHistory(history: BaseMessage[]): string {
  const contextMessages = history
    .filter(msg => msg.content && typeof msg.content === 'string' && msg.content.includes('[КОНТЕКСТ ДИАГРАММЫ]'))
    .reverse(); // Get most recent first
  
  if (contextMessages.length === 0) {
    throw new Error('Diagram context not found in conversation history. Please ensure context is sent before requesting modifications.');
  }
  
  const contextContent = contextMessages[0].content as string;
  const match = contextContent.match(/\[КОНТЕКСТ ДИАГРАММЫ\]([\s\S]*?)\[КОНЕЦ КОНТЕКСТА\]/);
  
  if (!match || !match[1]) {
    throw new Error('Failed to extract diagram context from message. Invalid format.');
  }
  
  return match[1].trim();
}

/**
 * Generate diagram modifications with script validation feedback loop using LangGraph
 * 
 * Flow:
 * 1. Generator (LLM) creates modification proposal
 * 2. Script Validator checks using deterministic rules:
 *    - Link types compatibility (can Variable connect to Stock?)
 *    - Node/link existence
 *    - Orphan nodes (nodes without connections)
 *    - Required fields (initialValue, value, flowRate, etc.)
 *    - Edge-to-edge connections (Variable -> Flow)
 *    - Operation order
 * 3. If validation fails -> loop back to Generator with feedback (max 3 iterations)
 * 4. If validation passes -> END
 * 5. Return final modifications (valid or best attempt after max iterations)
 */
export async function generateDiagramModificationsWithValidation(
  userRequest: string,
  history: BaseMessage[] = []
): Promise<DiagramModificationProposal> {
  // Extract diagram context from conversation history
  const diagramContext = extractDiagramContextFromHistory(history);
  
  console.log('[Workflow] Extracted diagram context:', {
    contextLength: diagramContext.length,
  });
  
  // Build the workflow graph with script validation feedback loop
  // Flow: Generator -> Script Validator -> (if pass) -> END
  //                       ↑__________________|
  //                       (if fail: feedback)
  const workflow = new StateGraph(DiagramModificationState)
    .addNode('generator', generatorNode as any)
    .addNode('scriptValidator', scriptValidatorNode as any)
    .addEdge(START, 'generator')
    .addEdge('generator', 'scriptValidator')
    .addConditionalEdges(
      'scriptValidator',
      shouldContinue as any,
      {
        'generator': 'generator', // Loop back if validation failed
        [END]: END,               // End if valid or max iterations
      }
    )
    .compile();
  
  // Initial state
  const initialState = {
    userRequest,
    diagramContext,
    conversationHistory: history,
    iterationCount: 0,
  };
  
  console.log('[Workflow] Starting diagram modification workflow with script validation');
  console.log('[Workflow] Architecture: Generator (LLM) -> Script Validator (Deterministic Rules)');
  
  // Run the workflow
  const finalState = await workflow.invoke(initialState);
  
  console.log('[Workflow] Completed:', {
    totalIterations: finalState.iterationCount,
    isValid: finalState.validationResult?.isValid,
    issuesCount: finalState.validationResult?.issues?.length || 0,
    issues: finalState.validationResult?.issues || [],
  });
  
  // If we reached max iterations without valid result, still return the last modifications
  // but log a warning
  if (!finalState.validationResult?.isValid && finalState.iterationCount >= 3) {
    console.warn('[Workflow] ⚠️  Max iterations reached without achieving valid modifications');
    console.warn('[Workflow] Remaining issues:', finalState.validationResult?.issues);
  }
  
  // Return final modifications (or fallback to last generated)
  return finalState.finalModifications || finalState.modifications;
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

