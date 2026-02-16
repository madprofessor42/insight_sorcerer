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
import { DiagramModificationProposalSchema, type DiagramModificationProposal } from '../types/diagram-modifications';
import { z } from 'zod';
import { 
  CHAT_SYSTEM_PROMPT, 
  DIAGRAM_MODIFICATION_GENERATOR_PROMPT,
  JSON_SCHEMA_INSTRUCTIONS,
  createValidationPrompt
} from './prompts';

// Environment configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// LLM Models from environment (or defaults)
const DEFAULT_MODEL = process.env.LLM_MODEL || 'anthropic/claude-3.5-sonnet';
const WRITER_MODEL = process.env.LLM_MODEL_WRITER || DEFAULT_MODEL;
const REVIEWER_MODEL = process.env.LLM_MODEL_REVIEWER || DEFAULT_MODEL;

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
 * State schema for diagram modification workflow with validation feedback loop
 */
const DiagramModificationState = new StateSchema({
  userRequest: z.string(),
  diagramContext: z.string(),
  conversationHistory: z.array(z.any()),
  modifications: z.any().optional(), // DiagramModificationProposal
  validationResult: z.any().optional(), // ValidationResult
  iterationCount: z.number().default(0),
  finalModifications: z.any().optional(), // DiagramModificationProposal
});

type DiagramModificationStateType = typeof DiagramModificationState.State;

/**
 * Validation result from feedback loop
 */
interface ValidationResult {
  isValid: boolean;
  issues: string[];
  correctedModifications?: DiagramModificationProposal;
}

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
  const llm = createLLM(WRITER_MODEL);
  console.log('[Generator] Using LLM model:', WRITER_MODEL);

  // Prepare messages
  const messages: BaseMessage[] = [
    new HumanMessage(DIAGRAM_MODIFICATION_GENERATOR_PROMPT + '\n\n' + JSON_SCHEMA_INSTRUCTIONS),
    ...history,
    new HumanMessage(`Запрос пользователя: ${userRequest}`),
  ];

  try {
    // Get response from LLM
    // For models that support it, we can pass response_format in the invoke options
    const response = await llm.invoke(messages, {
      response_format: { type: "json_object" }
    } as any); // Use 'as any' because TypeScript types may not include this option for all providers
    
    // Parse the response content as JSON
    let content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    // Clean up the content - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const jsonData = JSON.parse(content);
    
    // Validate and parse with Zod schema
    const result = DiagramModificationProposalSchema.parse(jsonData);
    
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
 * Validate and potentially fix proposed diagram modifications
 * This is a feedback loop that checks if the proposed changes are valid
 */
async function validateModifications(
  diagramContext: string,
  proposedModifications: DiagramModificationProposal
): Promise<ValidationResult> {
  const llm = createLLM(REVIEWER_MODEL);
  console.log('[Reviewer] Using LLM model:', REVIEWER_MODEL);

  const validationPrompt = createValidationPrompt(diagramContext, proposedModifications);

  try {
    const response = await llm.invoke([new HumanMessage(validationPrompt)], {
      response_format: { type: "json_object" }
    } as any);

    let content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    // Clean markdown if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const validationData = JSON.parse(content);
    
    // Validate the correctedModifications if present
    if (validationData.correctedModifications) {
      validationData.correctedModifications = DiagramModificationProposalSchema.parse(
        validationData.correctedModifications
      );
    }
    
    return validationData as ValidationResult;
  } catch (error) {
    console.error('Error validating modifications:', error);
    // If validation fails, return the original as valid (fail-safe)
    return {
      isValid: true,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Generator Node: Generate diagram modifications
 */
async function generatorNode(state: DiagramModificationStateType): Promise<Partial<DiagramModificationStateType>> {
  console.log(`[Generator] Iteration ${state.iterationCount + 1}: Generating modifications...`);
  
  // If we have validation feedback with corrected modifications, use them
  if (state.validationResult?.correctedModifications) {
    console.log('[Generator] Using corrected modifications from previous validation');
    return {
      modifications: state.validationResult.correctedModifications,
      iterationCount: state.iterationCount + 1,
    };
  }
  
  // Generate new modifications
  const modifications = await generateDiagramModifications(
    state.userRequest,
    state.conversationHistory as BaseMessage[]
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
 * Reviewer Node: Validate diagram modifications
 */
async function reviewerNode(state: DiagramModificationStateType): Promise<Partial<DiagramModificationStateType>> {
  console.log(`[Reviewer] Iteration ${state.iterationCount}: Validating modifications...`);
  
  if (!state.modifications) {
    throw new Error('No modifications to validate');
  }
  
  const validation = await validateModifications(state.diagramContext, state.modifications);
  
  console.log('[Reviewer] Validation result:', {
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
  
  // If invalid, return validation for next iteration
  return {
    validationResult: validation,
  };
}

/**
 * Conditional edge router: decide next step after reviewer
 */
function shouldContinue(state: DiagramModificationStateType): typeof END | 'generator' {
  const maxIterations = 3;
  
  console.log('[Router] Evaluating next step:', {
    isValid: state.validationResult?.isValid,
    iterationCount: state.iterationCount,
    maxIterations,
    hasValidationResult: !!state.validationResult,
    hasCorrectedModifications: !!state.validationResult?.correctedModifications,
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
  console.log('[Router] ↻ Routing back to generator for iteration', state.iterationCount + 1);
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
 * Generate diagram modifications with validation feedback loop using LangGraph
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
  
  // Build the workflow graph
  const workflow = new StateGraph(DiagramModificationState)
    .addNode('generator', generatorNode as any)
    .addNode('reviewer', reviewerNode as any)
    .addEdge(START, 'generator')
    .addEdge('generator', 'reviewer')
    .addConditionalEdges(
      'reviewer',
      shouldContinue as any,
      // Mapping: router return value -> node name
      {
        'generator': 'generator',
        [END]: END,
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
  
  console.log('[Workflow] Starting diagram modification workflow with validation feedback loop');
  
  // Run the workflow
  const finalState = await workflow.invoke(initialState);
  
  console.log('[Workflow] Completed:', {
    totalIterations: finalState.iterationCount,
    isValid: finalState.validationResult?.isValid,
    hasIssues: finalState.validationResult?.issues.length || 0,
  });
  
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

