/**
 * Diagram Context Utilities
 * 
 * Serializes diagram data into AI-friendly format for LLM context
 */

import type { RootState } from '../store/store';
import { 
  getNodeDisplayName, 
  getLinkDisplayName,
  isLinkLabelNodeData,
  findParentEdgeForLabelNode
} from './diagram-data/core';

/**
 * Simplified node representation for AI context
 */
interface AINodeContext {
  key: string;
  category: string;
  text: string;
  formula?: string;
  value?: number | string;
  initialValue?: number | string;
  hasFormula?: boolean;
  // Converter-specific fields
  input?: string;
  values?: string;
}

/**
 * Simplified link representation for AI context
 */
interface AILinkContext {
  key?: string;
  from: string;
  to: string;
  type: string;
  label?: string;
  flowRate?: string | number;
  bidirectional?: boolean;
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

/**
 * Extract diagram context from Redux state
 */
export function extractDiagramContext(state: RootState): DiagramContext {
  const { nodeDataArray, linkDataArray, simulationConfig } = state.diagram;

  // Serialize nodes with relevant information (exclude LinkLabel nodes)
  const nodes: AINodeContext[] = nodeDataArray
    .filter((node: any) => !isLinkLabelNodeData(node))
    .map((node: any) => ({
      key: String(node.key),
      category: node.category || 'unknown',
      text: getNodeDisplayName(node),
      formula: node.formula,
      value: node.value, // Current value for Variables
      initialValue: node.initialValue, // Initial value for Stocks
      hasFormula: Boolean(node.formula),
      // Converter-specific fields
      input: node.input,
      values: node.values,
    }));

  // Serialize links with proper display names, resolving LinkLabel connections
  const links: AILinkContext[] = linkDataArray.map((link: any) => {
    let fromKey = link.from;
    let toKey = link.to;
    let isFromEdge = false;
    let isToEdge = false;
    
    // Resolve LinkLabel nodes to their parent edges
    const fromNode = nodeDataArray.find((n: any) => n.key === link.from);
    const toNode = nodeDataArray.find((n: any) => n.key === link.to);
    
    // If from is a LinkLabel, get the parent edge key
    if (fromNode && isLinkLabelNodeData(fromNode)) {
      const parentEdge = findParentEdgeForLabelNode(fromNode.key, linkDataArray);
      if (parentEdge) {
        fromKey = parentEdge.key;
        isFromEdge = true;
      }
    }
    
    // If to is a LinkLabel, get the parent edge key
    if (toNode && isLinkLabelNodeData(toNode)) {
      const parentEdge = findParentEdgeForLabelNode(toNode.key, linkDataArray);
      if (parentEdge) {
        toKey = parentEdge.key;
        isToEdge = true;
      }
    }
    
    return {
      key: String(link.key),
      from: String(fromKey),
      to: String(toKey),
      type: link.category || 'link',
      label: getLinkDisplayName(link),
      flowRate: link.flowRate,
      bidirectional: link.bidirectional === true,
      isFromEdge,
      isToEdge,
    } as any;
  });

  // Count nodes by type (exclude LinkLabel nodes)
  const nodesByType: Record<string, number> = {};
  nodeDataArray.forEach((node: any) => {
    if (!isLinkLabelNodeData(node)) {
      const category = node.category || 'unknown';
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
      // Try to find in nodes first
      let fromNode = context.nodes.find(n => n.key === link.from);
      let toNode = context.nodes.find(n => n.key === link.to);
      
      let fromText = fromNode?.text;
      let toText = toNode?.text;
      
      // If from/to is actually another link (edge-to-edge connection)
      if (!fromNode && link.isFromEdge) {
        // Find the actual link by key
        const actualLink = context.links.find((l: any) => l.key === link.from);
        fromText = actualLink?.label || link.from;
      }
      
      if (!toNode && link.isToEdge) {
        // Find the actual link by key
        const actualLink = context.links.find((l: any) => l.key === link.to);
        toText = actualLink?.label || link.to;
      }
      
      // Fallback to keys if still not found
      if (!fromText) fromText = link.from;
      if (!toText) toText = link.to;
      
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
      // Try to find in nodes first
      let fromNode = context.nodes.find(n => n.key === link.from);
      let toNode = context.nodes.find(n => n.key === link.to);
      
      let fromText = fromNode?.text;
      let toText = toNode?.text;
      
      // If from/to is actually another link (edge-to-edge connection)
      if (!fromNode && link.isFromEdge) {
        // Find the actual link by key
        const actualLink = context.links.find((l: any) => l.key === link.from);
        fromText = actualLink?.label || link.from;
      }
      
      if (!toNode && link.isToEdge) {
        // Find the actual link by key
        const actualLink = context.links.find((l: any) => l.key === link.to);
        toText = actualLink?.label || link.to;
      }
      
      // Fallback to keys if still not found
      if (!fromText) fromText = link.from;
      if (!toText) toText = link.to;
      
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

/**
 * Get human-readable label for node type
 */
function getNodeTypeLabel(category: string): string {
  const labels: Record<string, string> = {
    'stock': 'Stock (Запас)',
    'flow': 'Flow (Поток)',
    'variable': 'Variable (Переменная)',
    'converter': 'Converter (Конвертер)',
    'unknown': 'Неизвестный тип',
  };
  return labels[category] || category;
}

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

