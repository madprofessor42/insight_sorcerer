/**
 * Display utilities for diagram data.
 * 
 * This module provides functions for resolving diagram data into
 * human-readable display information for UI components (DebugPanel, etc.).
 * 
 * All resolution functions:
 * - Use core utilities for basic data access
 * - Handle edge-to-edge connections (LinkLabel nodes)
 * - Return structured display info objects
 * - Are type-agnostic (derive everything from configuration)
 */

import type * as go from 'gojs';
import {
  getNodeDisplayName,
  isLinkLabelNodeData,
  findParentEdgeForLabelNode,
  getLinkDisplayName,
  getLinkType,
  isLinkBidirectional,
  getLinkDirectionSymbol,
  getLinkColor,
  getLinkLabel,
} from './core';

// ============================================================================
// DISPLAY INFO TYPES
// ============================================================================

/**
 * Resolved information about a node for display purposes
 */
export interface NodeDisplayInfo {
  /** Display name of the node */
  name: string;
  /** Node type (category) */
  type: string;
  /** Node key as string */
  id: string;
}

/**
 * Resolved information about an edge (link) for connection endpoint display.
 * Used when a link connects to another edge via a LinkLabel node.
 */
export interface EdgeDisplayInfo {
  /** Display name of the edge */
  name: string;
  /** Edge type (category, e.g. 'flow', 'link') */
  type: string;
  /** Edge key as string */
  id: string;
  /** Indicates this is an edge, not a node */
  isEdge: true;
}

/**
 * Union type for connection endpoints - can be either a node or an edge
 */
export type ConnectionEndpointInfo = NodeDisplayInfo | (EdgeDisplayInfo & { isEdge: true });

/**
 * Resolved information about a link for display purposes
 */
export interface LinkDisplayInfo {
  /** Display name of the link */
  name: string;
  /** Normalized link type (e.g. 'flow', 'link') */
  type: string;
  /** UI label from configuration (e.g. 'Flow', 'Link') */
  label: string;
  /** Link key as string */
  id: string;
  /** Whether the link is bidirectional */
  isBidirectional: boolean;
  /** Stroke color from link configuration */
  color: string;
  /** Arrow symbol representing direction */
  directionSymbol: string;
  /** Source endpoint info (node or edge) */
  from: ConnectionEndpointInfo;
  /** Target endpoint info (node or edge) */
  to: ConnectionEndpointInfo;
}

// ============================================================================
// RESOLUTION FUNCTIONS
// ============================================================================

/**
 * Resolve a node key to display information.
 * Looks up the node in the provided array and extracts name, type, id.
 * Falls back to default values from configuration if no name is set.
 * 
 * NOTE: This function does NOT resolve LinkLabel → parent edge.
 * Use resolveConnectionEndpoint() for edge-to-edge aware resolution.
 *
 * @param key - Node key to resolve
 * @param nodeDataArray - Array of node data objects from Redux store
 * @returns NodeDisplayInfo with resolved or fallback values
 */
export function resolveNodeInfo(
  key: go.Key | null | undefined,
  nodeDataArray: Array<go.ObjectData>
): NodeDisplayInfo {
  if (key === null || key === undefined) {
    return { name: '—', type: '—', id: '—' };
  }

  const node = nodeDataArray.find(n => n.key === key);
  if (!node) {
    return { name: '(not found)', type: '—', id: String(key) };
  }

  // Use core utility for name resolution (handles defaults)
  return {
    name: getNodeDisplayName(node),
    type: (node.category as string) || 'Unknown',
    id: String(node.key),
  };
}

/**
 * Resolve edge (link) info for display purposes.
 * Used when a connection endpoint is an edge (via LinkLabel).
 *
 * @param edgeData - Edge/link data object from Redux store
 * @returns EdgeDisplayInfo with resolved values
 */
export function resolveEdgeInfo(edgeData: go.ObjectData): EdgeDisplayInfo {
  return {
    name: getLinkDisplayName(edgeData),
    type: getLinkLabel(edgeData), // Use human-readable label like "Flow" instead of "flow"
    id: String(edgeData.key),
    isEdge: true,
  };
}

/**
 * Resolve a connection endpoint (node key) to display information.
 * Handles both regular nodes and LinkLabel nodes (which resolve to parent edge info).
 *
 * @param key - Node key to resolve
 * @param nodeDataArray - Array of node data objects from Redux store
 * @param linkDataArray - Array of link data objects from Redux store
 * @returns NodeDisplayInfo or EdgeDisplayInfo depending on endpoint type
 */
export function resolveConnectionEndpoint(
  key: go.Key | null | undefined,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): ConnectionEndpointInfo {
  if (key === null || key === undefined) {
    return { name: '—', type: '—', id: '—' };
  }

  const node = nodeDataArray.find(n => n.key === key);
  if (!node) {
    return { name: '(not found)', type: '—', id: String(key) };
  }

  // Check if this is a LinkLabel node → resolve to parent edge (uses core utility)
  if (isLinkLabelNodeData(node)) {
    const parentEdge = findParentEdgeForLabelNode(node.key, linkDataArray);
    if (parentEdge) {
      return resolveEdgeInfo(parentEdge);
    }
    // Fallback: parent edge not found (shouldn't happen normally)
    return {
      name: '(edge not found)',
      type: '(unknown)',
      id: String(key),
      isEdge: true,
    };
  }

  // Regular node (reuse resolveNodeInfo logic)
  return resolveNodeInfo(key, nodeDataArray);
}

/**
 * Resolve complete display information for a link, including
 * source and target endpoint details. Endpoints can be nodes or edges.
 * When an endpoint is a LinkLabel (edge connection point), it resolves
 * to the parent edge info transparently.
 *
 * All values are derived from configuration — no hardcoded type checks.
 *
 * @param linkData - Link data object from Redux store
 * @param nodeDataArray - Array of node data objects from Redux store
 * @param linkDataArray - Array of link data objects from Redux store (needed for edge resolution)
 * @returns LinkDisplayInfo with all resolved information
 */
export function resolveLinkInfo(
  linkData: go.ObjectData,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData> = []
): LinkDisplayInfo {
  return {
    name: getLinkDisplayName(linkData),
    type: getLinkType(linkData),
    label: getLinkLabel(linkData),
    id: String(linkData.key),
    isBidirectional: isLinkBidirectional(linkData),
    color: getLinkColor(linkData),
    directionSymbol: getLinkDirectionSymbol(linkData),
    from: resolveConnectionEndpoint(linkData.from as go.Key | null, nodeDataArray, linkDataArray),
    to: resolveConnectionEndpoint(linkData.to as go.Key | null, nodeDataArray, linkDataArray),
  };
}

/**
 * Type guard to check if a connection endpoint is an edge
 *
 * @param endpoint - Connection endpoint info
 * @returns true if the endpoint is an edge (EdgeDisplayInfo)
 */
export function isEdgeEndpoint(endpoint: ConnectionEndpointInfo): endpoint is EdgeDisplayInfo {
  return 'isEdge' in endpoint && endpoint.isEdge === true;
}

