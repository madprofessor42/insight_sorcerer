/**
 * Diagram data resolution utilities
 *
 * Pure functions for resolving node/link data from Redux arrays.
 * Used by UI components (DebugPanel, etc.) to display human-readable info.
 *
 * All functions are type-agnostic — they derive everything from
 * LINK_CONFIGURATIONS / NODE_CONFIGURATIONS, never hardcode specific types.
 *
 * EDGE-TO-EDGE SUPPORT:
 * When a link connects to an edge (via a LinkLabel node), resolution functions
 * transparently resolve to the parent edge info instead of showing "LinkLabel".
 */

import * as go from 'gojs';
import { normalizeLinkType, getLinkConfiguration, LINK_LABEL_CATEGORY } from '../config/diagram-rules';
import type { LinkType } from '../config/diagram-rules';

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
  type: LinkType;
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

/**
 * Check if a node data object represents a LinkLabel node.
 * LinkLabel nodes are invisible connection points on edges.
 *
 * @param nodeData - Node data object
 * @returns true if the node is a LinkLabel
 */
export function isLinkLabelNodeData(nodeData: go.ObjectData): boolean {
  return nodeData.category === LINK_LABEL_CATEGORY;
}

/**
 * Find the parent edge for a LinkLabel node.
 * GoJS stores label node keys in the link's `labelKeys` array.
 * We reverse-lookup: find the link whose labelKeys contains this node's key.
 *
 * @param labelNodeKey - Key of the LinkLabel node
 * @param linkDataArray - Array of link data objects from Redux store
 * @returns Parent edge data object or null if not found
 */
export function findParentEdgeForLabelNode(
  labelNodeKey: go.Key,
  linkDataArray: Array<go.ObjectData>
): go.ObjectData | null {
  // Find the link that has this label node in its labelKeys array
  return linkDataArray.find(link => {
    const labelKeys = link.labelKeys;
    if (!Array.isArray(labelKeys)) return false;
    return labelKeys.includes(labelNodeKey);
  }) ?? null;
}

/**
 * Resolve edge (link) info for display purposes.
 * Used when a connection endpoint is an edge (via LinkLabel).
 *
 * @param edgeData - Edge/link data object from Redux store
 * @returns EdgeDisplayInfo with resolved values
 */
export function resolveEdgeInfo(edgeData: go.ObjectData): EdgeDisplayInfo {
  const type = getLinkType(edgeData);
  const config = getLinkConfiguration(type);
  const label = config?.ui.label ?? type;
  
  return {
    name: getLinkDisplayName(edgeData),
    type: label, // Use human-readable label like "Flow" instead of "flow"
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

  // Check if this is a LinkLabel node → resolve to parent edge
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

  // Regular node
  return {
    name: (node.name as string) || (node.text as string) || '(no name)',
    type: (node.category as string) || 'Unknown',
    id: String(node.key),
  };
}

/**
 * Resolve a node key to display information.
 * Looks up the node in the provided array and extracts name, type, id.
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

  return {
    name: (node.name as string) || (node.text as string) || '(no name)',
    type: (node.category as string) || 'Unknown',
    id: String(node.key),
  };
}

/**
 * Get the display name of a link.
 * Falls back to '(unnamed)' if no text is set.
 * 
 * @param linkData - Link data object from Redux store
 * @returns Display name string
 */
export function getLinkDisplayName(linkData: go.ObjectData): string {
  return (linkData.text as string) || '(unnamed)';
}

/**
 * Get the normalized type of a link.
 * 
 * @param linkData - Link data object from Redux store
 * @returns Normalized LinkType
 */
export function getLinkType(linkData: go.ObjectData): LinkType {
  return normalizeLinkType(linkData.category);
}

/**
 * Check if a link is bidirectional.
 * 
 * @param linkData - Link data object from Redux store
 * @returns true if bidirectional
 */
export function isLinkBidirectional(linkData: go.ObjectData): boolean {
  return linkData.bidirectional === true;
}

/**
 * Get the direction symbol for a link (arrow representation).
 * 
 * @param linkData - Link data object from Redux store
 * @returns Arrow symbol string ('⇄' for bidirectional, '→' for unidirectional)
 */
export function getLinkDirectionSymbol(linkData: go.ObjectData): string {
  return isLinkBidirectional(linkData) ? '⇄' : '→';
}

/**
 * Get the stroke color for a link type from configuration.
 * Falls back to a neutral color if config is not found.
 * 
 * @param linkData - Link data object from Redux store
 * @returns CSS color string
 */
export function getLinkColor(linkData: go.ObjectData): string {
  const type = getLinkType(linkData);
  const config = getLinkConfiguration(type);
  return config?.style.stroke ?? '#888';
}

/**
 * Get the UI label for a link type from configuration.
 * Falls back to the raw type string if config is not found.
 * 
 * @param linkData - Link data object from Redux store
 * @returns Label string from configuration
 */
export function getLinkLabel(linkData: go.ObjectData): string {
  const type = getLinkType(linkData);
  const config = getLinkConfiguration(type);
  return config?.ui.label ?? type;
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
  const type = getLinkType(linkData);
  const config = getLinkConfiguration(type);
  const bidirectional = isLinkBidirectional(linkData);

  return {
    name: getLinkDisplayName(linkData),
    type,
    label: config?.ui.label ?? type,
    id: String(linkData.key),
    isBidirectional: bidirectional,
    color: config?.style.stroke ?? '#888',
    directionSymbol: bidirectional ? '⇄' : '→',
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
