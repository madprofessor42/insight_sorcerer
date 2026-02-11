/**
 * Simulation-specific utilities for diagram data conversion.
 * 
 * This module provides endpoint resolution functions specifically for the
 * simulation layer. These functions:
 * - Import core utilities for basic data access and type guards
 * - Return prefixed keys ('node:X', 'link:X') for primitiveMap lookup
 * - Handle Cloud nodes (valid for flows as null, invalid for links)
 * - Handle LinkLabel nodes (resolve to parent edge for edge-to-edge connections)
 * 
 * These are NOT for UI display - they are for simulation primitive creation.
 */

import type * as go from 'gojs';
import { isLinkLabelNodeData, findParentEdgeForLabelNode } from './core';

/**
 * Error type for simulation conversion operations.
 */
export interface SimulationConversionError {
  type: 'missing_node' | 'missing_link' | 'invalid_formula' | 'circular_dependency';
  message: string;
  nodeKey?: string | number;
  linkKey?: string | number;
}

/**
 * Resolve endpoint key for Flow primitive lookup.
 * 
 * Flows connect Stocks (or Cloud as null). This function handles:
 * - LinkLabel nodes: skipped (flows don't connect to edges) → returns undefined
 * - Cloud nodes: valid (external source/sink) → returns null
 * - Regular nodes (Stock): returns the key for primitiveMap lookup
 * 
 * @param endpointKey - The endpoint key from link.from or link.to
 * @param nodeDataArray - Array of all nodes in the diagram
 * @returns Node key for lookup, null for Cloud, or undefined if invalid/missing
 */
export function resolveFlowEndpointKey(
  endpointKey: go.Key | null | undefined,
  nodeDataArray: Array<go.ObjectData>
): go.Key | null | undefined {
  if (endpointKey === null || endpointKey === undefined) {
    return undefined;
  }
  
  const node = nodeDataArray.find(n => n.key === endpointKey);
  if (!node) {
    return undefined;
  }
  
  // LinkLabel nodes shouldn't be flow endpoints (flows connect to stocks, not edges)
  if (isLinkLabelNodeData(node)) {
    return undefined;
  }
  
  // Cloud nodes are valid for flows (represent external source/sink)
  if (node.category === 'Cloud') {
    return null; // null is the correct value for Cloud in simulation
  }
  
  // Regular node (Stock, Variable, etc.)
  return endpointKey;
}

/**
 * Resolve endpoint for Link primitive (influence link).
 * 
 * Influence links connect primitives (Stocks, Variables, Flows, other Links).
 * This function reuses core diagram-data logic (`findParentEdgeForLabelNode`)
 * but returns prefixed keys suitable for primitiveMap lookup.
 * 
 * Handles:
 * - LinkLabel nodes: resolves to parent edge (edge-to-edge connection) → 'link:X'
 * - Cloud nodes: error (influence links can't connect to clouds)
 * - Regular nodes: returns node key → 'node:X'
 * 
 * @param endpointKey - The endpoint key from link.from or link.to
 * @param nodeDataArray - Array of all nodes in the diagram
 * @param linkDataArray - Array of all links in the diagram (for parent edge lookup)
 * @param endpointLabel - Label for error messages ('source' or 'target')
 * @returns Object with either mapKey (prefixed key for primitiveMap) or error
 */
export function resolveLinkEndpoint(
  endpointKey: go.Key | null | undefined,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>,
  endpointLabel: string
): { mapKey?: string; error?: SimulationConversionError } {
  if (endpointKey === null || endpointKey === undefined) {
    return {
      error: {
        type: 'missing_node',
        message: `Link has missing ${endpointLabel} endpoint`,
      },
    };
  }
  
  const node = nodeDataArray.find(n => n.key === endpointKey);
  if (!node) {
    return {
      error: {
        type: 'missing_node',
        message: `Link references non-existent ${endpointLabel} node: ${endpointKey}`,
      },
    };
  }
  
  // Cloud nodes are NOT valid for influence links
  if (node.category === 'Cloud') {
    return {
      error: {
        type: 'missing_node',
        message: `Link cannot connect ${endpointLabel === 'source' ? 'from' : 'to'} Cloud node`,
      },
    };
  }
  
  // LinkLabel node → resolve to parent edge (edge-to-edge connection)
  // Reuse core diagram-data utility for consistency
  if (isLinkLabelNodeData(node)) {
    const parentEdge = findParentEdgeForLabelNode(endpointKey, linkDataArray);
    
    if (parentEdge) {
      // Return prefixed key for parent edge (influence link connects to flow/link)
      return { mapKey: `link:${parentEdge.key}` };
    }
    
    return {
      error: {
        type: 'missing_link',
        message: `LinkLabel node ${endpointKey} has no parent edge`,
      },
    };
  }
  
  // Regular node (Stock, Variable)
  return { mapKey: `node:${endpointKey}` };
}

