/**
 * Diagram data resolution utilities
 * 
 * Pure functions for resolving node/link data from Redux arrays.
 * Used by UI components (DebugPanel, etc.) to display human-readable info.
 * 
 * All functions are type-agnostic — they derive everything from
 * LINK_CONFIGURATIONS / NODE_CONFIGURATIONS, never hardcode specific types.
 */

import * as go from 'gojs';
import { normalizeLinkType, getLinkConfiguration } from '../config/diagram-rules';
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
  /** Source node info */
  from: NodeDisplayInfo;
  /** Target node info */
  to: NodeDisplayInfo;
}

/**
 * Resolve a node key to display information.
 * Looks up the node in the provided array and extracts name, type, id.
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
 * source and target node details. All values are derived from
 * configuration — no hardcoded type checks.
 * 
 * @param linkData - Link data object from Redux store
 * @param nodeDataArray - Array of node data objects from Redux store
 * @returns LinkDisplayInfo with all resolved information
 */
export function resolveLinkInfo(
  linkData: go.ObjectData,
  nodeDataArray: Array<go.ObjectData>
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
    from: resolveNodeInfo(linkData.from as go.Key | null, nodeDataArray),
    to: resolveNodeInfo(linkData.to as go.Key | null, nodeDataArray),
  };
}
