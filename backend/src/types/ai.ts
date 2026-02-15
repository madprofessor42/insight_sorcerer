/**
 * Типы для AI/LLM endpoints
 */

export type AIAction = 'build' | 'debug' | 'formula' | 'analyze' | 'suggest';

export interface AIQueryRequest {
  message: string;
  context?: {
    action?: AIAction;
    diagram?: {
      nodeDataArray?: any[];
      linkDataArray?: any[];
    };
    selectedNode?: any;
    selectedEdge?: any;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AIQueryResponse {
  success: boolean;
  message: string;
  suggestions?: string[];
  timestamp: string;
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planned' | 'beta';
}

