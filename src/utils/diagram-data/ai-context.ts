/**
 * AI Context Utilities
 * 
 * Serializes diagram data into AI-friendly format for LLM context.
 * Uses existing diagram-data utilities to avoid duplication.
 */

import type * as go from 'gojs';
import type { RootState } from '../../store/store';
import { getNodeConfiguration } from '../../config';
import type { NodeType, LinkType } from '../../config';
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
 * Get human-readable label for node type using configuration
 */
function getNodeTypeLabel(category: string): string {
  const config = getNodeConfiguration(category as NodeType);
  if (config) {
    return config.label;
  }
  
  // Fallback labels
  const fallbackLabels: Record<string, string> = {
    'stock': 'Stock',
    'variable': 'Variable',
    'converter': 'Converter',
    'cloud': 'Cloud',
    'unknown': 'Unknown',
  };
  return fallbackLabels[category.toLowerCase()] || category;
}

/**
 * Format diagram context for LLM prompt
 */
export function formatDiagramContextForLLM(context: DiagramContext): string {
  if (context.totalNodes === 0) {
    return 'Диаграмма пуста. Пользователь только начинает работу.';
  }

  const parts: string[] = [];

  // Overview
  parts.push(`📊 **Текущая диаграмма:**`);
  parts.push(`- Всего элементов: ${context.totalNodes} узлов, ${context.totalLinks} связей`);

  // Nodes by type
  if (Object.keys(context.nodesByType).length > 0) {
    parts.push(`- Типы элементов:`);
    Object.entries(context.nodesByType).forEach(([type, count]) => {
      const typeLabel = getNodeTypeLabel(type);
      parts.push(`  • ${typeLabel}: ${count}`);
    });
  }

  // Nodes details
  if (context.nodes.length > 0) {
    parts.push(`\n🔷 **Элементы диаграммы:**`);
    context.nodes.forEach((node, index) => {
      const typeLabel = getNodeTypeLabel(node.category);
      let nodeInfo = `${index + 1}. [${typeLabel}] "${node.text}"`;
      
      if (node.formula) {
        nodeInfo += ` | Формула: ${node.formula}`;
      }
      
      if (node.value !== undefined) {
        nodeInfo += ` | Значение: ${typeof node.value === 'object' ? JSON.stringify(node.value) : node.value}`;
      }
      
      if (node.initialValue !== undefined) {
        nodeInfo += ` | Начальное значение: ${typeof node.initialValue === 'object' ? JSON.stringify(node.initialValue) : node.initialValue}`;
      }
      
      // Converter-specific fields
      if (node.category === 'Converter') {
        if (node.input !== undefined) {
          nodeInfo += ` | Input Source: ${node.input}`;
        }
        if (node.values !== undefined) {
          nodeInfo += ` | Data Points: ${node.values}`;
        }
      }
      
      parts.push(nodeInfo);
    });
  }

  // Separate links into regular links and flows
  const regularLinks = context.links.filter((l: any) => l.type !== 'flow' && l.type !== 'biflow');
  const flowLinks = context.links.filter((l: any) => l.type === 'flow' || l.type === 'biflow');
  
  // Regular Links
  if (regularLinks.length > 0) {
    parts.push(`\n🔗 **Links:**`);
    regularLinks.forEach((link: any, index) => {
      const fromEndpoint = link._fromEndpoint;
      const toEndpoint = link._toEndpoint;
      
      // Get display text for endpoints
      const fromText = isEdgeEndpoint(fromEndpoint) 
        ? fromEndpoint.name 
        : context.nodes.find(n => n.key === link.from)?.text || link.from;
      
      const toText = isEdgeEndpoint(toEndpoint)
        ? toEndpoint.name
        : context.nodes.find(n => n.key === link.to)?.text || link.to;
      
      // Format: "Source" -> "Target" (имя: Label) or "Source" ↔ "Target" (имя: Label) for bidirectional
      const arrow = link.bidirectional ? '↔' : '->';
      let linkInfo = `${index + 1}. "${fromText}" ${arrow} "${toText}"`;
      
      // Add link label/name
      if (link.label) {
        linkInfo += ` (имя: ${link.label})`;
      }
      
      parts.push(linkInfo);
    });
  }
  
  // Flows
  if (flowLinks.length > 0) {
    parts.push(`\n💧 **Flows:**`);
    flowLinks.forEach((link: any, index) => {
      const fromEndpoint = link._fromEndpoint;
      const toEndpoint = link._toEndpoint;
      
      // Get display text for endpoints
      const fromText = isEdgeEndpoint(fromEndpoint)
        ? fromEndpoint.name
        : context.nodes.find(n => n.key === link.from)?.text || link.from;
      
      const toText = isEdgeEndpoint(toEndpoint)
        ? toEndpoint.name
        : context.nodes.find(n => n.key === link.to)?.text || link.to;
      
      // Format: "Source" → "Target" (имя: Name) | Flow Rate: value
      let flowInfo = `${index + 1}. "${fromText}" → "${toText}"`;
      
      // Add flow name/label
      if (link.label) {
        flowInfo += ` (имя: ${link.label})`;
      }
      
      // Add flow rate
      if (link.flowRate !== undefined) {
        flowInfo += ` | Flow Rate: ${typeof link.flowRate === 'object' ? JSON.stringify(link.flowRate) : link.flowRate}`;
      }
      
      parts.push(flowInfo);
    });
  }

  // Simulation info
  if (context.hasSimulation) {
    parts.push(`\n⚙️ **Настройки симуляции:**`);
    parts.push(`- Шагов: ${context.simulationSteps}`);
    parts.push(`- Единица времени: ${context.simulationTimeUnit}`);
  }

  return parts.join('\n');
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

