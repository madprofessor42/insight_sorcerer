/**
 * AI Context Utilities
 * 
 * Serializes diagram data into AI-friendly format for LLM context.
 * Uses existing diagram-data utilities to avoid duplication.
 */

import type * as go from 'gojs';
import type { RootState } from '../../store/store';
import type { LinkType } from '../../config';
import {
  getNodeDisplayName,
  getLinkDisplayName,
  getLinkType,
  isLinkLabelNodeData,
  isLinkBidirectional,
} from './core';
import { isEdgeEndpoint, resolveConnectionEndpoint } from './display';

// ============================================================================
// AI CONTEXT TYPES
// ============================================================================

/**
 * Simplified node representation for AI context
 */
export interface AINodeContext {
  key: string;
  category: string;
  text: string;
  formula?: string;
  value?: number | string;
  initialValue?: number | string;
  // Converter-specific fields
  input?: string;
  values?: string;
}

/**
 * Simplified link representation for AI context
 */
export interface AILinkContext {
  key: string;
  from: string;
  to: string;
  type: LinkType;
  label: string;
  flowRate?: string | number;
  bidirectional: boolean;
}

/**
 * Complete diagram context for AI
 */
export interface DiagramContext {
  nodes: AINodeContext[];
  links: AILinkContext[];
  totalNodes: number;
  totalLinks: number;
  nodesByType: Record<string, number>;
  hasSimulation: boolean;
  simulationSteps?: number;
  simulationTimeUnit?: string;
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract diagram context from Redux state
 */
export function extractDiagramContext(state: RootState): DiagramContext {
  const { nodeDataArray, linkDataArray, simulationConfig } = state.diagram;

  // Serialize nodes with relevant information (exclude LinkLabel nodes)
  const nodes: AINodeContext[] = nodeDataArray
    .filter((node: go.ObjectData) => !isLinkLabelNodeData(node))
    .map((node: go.ObjectData) => ({
      key: String(node.key),
      category: node.category as string || 'unknown',
      text: getNodeDisplayName(node),
      formula: node.formula as string | undefined,
      value: node.value as number | string | undefined,
      initialValue: node.initialValue as number | string | undefined,
      // Converter-specific fields
      input: node.input as string | undefined,
      values: node.values as string | undefined,
    }));

  // Serialize links with proper display names, resolving LinkLabel connections
  const links: AILinkContext[] = linkDataArray.map((link: go.ObjectData) => {
    // Resolve endpoints (handles LinkLabel → parent edge)
    const fromEndpoint = resolveConnectionEndpoint(
      link.from as go.Key,
      nodeDataArray,
      linkDataArray
    );
    const toEndpoint = resolveConnectionEndpoint(
      link.to as go.Key,
      nodeDataArray,
      linkDataArray
    );

    return {
      key: String(link.key),
      from: String(fromEndpoint.id),
      to: String(toEndpoint.id),
      type: getLinkType(link),
      label: getLinkDisplayName(link),
      flowRate: link.flowRate as string | number | undefined,
      bidirectional: isLinkBidirectional(link),
      // Store endpoint info for formatting
      _fromEndpoint: fromEndpoint,
      _toEndpoint: toEndpoint,
    } as any;
  });

  // Count nodes by type (exclude LinkLabel nodes)
  const nodesByType: Record<string, number> = {};
  nodeDataArray.forEach((node: go.ObjectData) => {
    if (!isLinkLabelNodeData(node)) {
      const category = (node.category as string) || 'unknown';
      nodesByType[category] = (nodesByType[category] || 0) + 1;
    }
  });

  return {
    nodes,
    links,
    totalNodes: nodes.length,
    totalLinks: links.length,
    nodesByType,
    hasSimulation: Boolean(simulationConfig.timeLength),
    simulationSteps: simulationConfig.timeLength,
    simulationTimeUnit: simulationConfig.timeUnits,
  };
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format diagram context for LLM prompt as JSON
 * Returns structured JSON with IDs and names for better understanding
 */
export function formatDiagramContextForLLM(context: DiagramContext): string {
  if (context.totalNodes === 0) {
    return JSON.stringify({ empty: true, message: 'Диаграмма пуста' }, null, 2);
  }

  // Create structured JSON with both IDs and display names
  const jsonContext: any = {
    summary: {
      totalNodes: context.totalNodes,
      totalLinks: context.totalLinks,
      nodesByType: context.nodesByType,
    },
    nodes: context.nodes.map(node => {
      const nodeData: any = {
        id: node.key,
        name: node.text,
        category: node.category,
      };
      
      // Variable: only has 'value' field
      if (node.category === 'Variable' && node.value !== undefined) {
        nodeData.value = node.value;
      }
      
      // Stock: only has 'initialValue' field
      if (node.category === 'Stock' && node.initialValue !== undefined) {
        nodeData.initialValue = node.initialValue;
      }
      
      // Converter: has 'input' and 'values' fields
      if (node.category === 'Converter') {
        if (node.input !== undefined) {
          nodeData.input = node.input;
        }
        if (node.values !== undefined) {
          nodeData.values = node.values;
        }
      }
      
      return nodeData;
    }),
    links: context.links.map(link => {
      const fromEndpoint = (link as any)._fromEndpoint;
      const toEndpoint = (link as any)._toEndpoint;
      
      // Get display text for endpoints
      const fromText = isEdgeEndpoint(fromEndpoint) 
        ? fromEndpoint.name 
        : context.nodes.find(n => n.key === link.from)?.text || link.from;
      
      const toText = isEdgeEndpoint(toEndpoint)
        ? toEndpoint.name
        : context.nodes.find(n => n.key === link.to)?.text || link.to;
      
      const linkData: any = {
        id: link.key,
        fromId: link.from,
        fromName: fromText,
        toId: link.to,
        toName: toText,
        type: link.type,
        name: link.label || '',
      };
      
      if (link.bidirectional) {
        linkData.bidirectional = true;
      }
      
      if (link.flowRate !== undefined) {
        linkData.flowRate = link.flowRate;
      }
      
      return linkData;
    }),
  };
  
  if (context.hasSimulation) {
    jsonContext.simulation = {
      steps: context.simulationSteps,
      timeUnit: context.simulationTimeUnit,
    };
  }
  
  return JSON.stringify(jsonContext, null, 2);
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get node by key from context
 */
export function getNodeFromContext(
  context: DiagramContext,
  nodeKey: string
): AINodeContext | undefined {
  return context.nodes.find(n => n.key === nodeKey);
}

/**
 * Get all links connected to a node
 */
export function getNodeConnections(
  context: DiagramContext,
  nodeKey: string
): { incoming: AILinkContext[]; outgoing: AILinkContext[] } {
  return {
    incoming: context.links.filter(l => l.to === nodeKey),
    outgoing: context.links.filter(l => l.from === nodeKey),
  };
}


