/**
 * Selectable Items Utilities
 * 
 * Utilities for getting available nodes and edges for chart configuration.
 */

import type * as go from 'gojs';
import { VISUALIZABLE_TYPES } from './types';
import { isLinkLabelNodeData, resolveNodeInfo, getLinkDisplayName } from '../diagram-data';

/**
 * Available node/edge item for selection in chart configuration
 */
export interface SelectableItem {
  key: string;
  displayName: string;
  type: 'node' | 'edge';
}

/**
 * Get all available nodes and edges as selectable items.
 * Only includes types that produce simulation series data for visualization.
 * 
 * @param nodeDataArray - Array of node data from diagram
 * @param linkDataArray - Array of link data from diagram
 * @returns Array of selectable items
 */
export function getSelectableItems(
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): SelectableItem[] {
  const items: SelectableItem[] = [];

  // Add nodes (only those that have simulation series data)
  // Stock and Variable nodes create simulation primitives with time series
  for (const node of nodeDataArray) {
    // Skip LinkLabel nodes - they are invisible connection points on edges
    if (isLinkLabelNodeData(node)) {
      continue;
    }
    
    // Only include nodes that produce simulation series data
    // Excludes: Cloud (auto-created endpoints), LinkLabel (connection points)
    if (!VISUALIZABLE_TYPES.nodes.includes(node.category as any)) {
      continue;
    }
    
    const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
    items.push({
      key: String(node.key),
      displayName: nodeInfo.name,
      type: 'node',
    });
  }

  // Add edges (only those that have simulation series data)
  // Currently only 'flow' links produce time series data
  for (const link of linkDataArray) {
    // Only include links that produce simulation series data
    // Excludes: 'link' type (dependency connections without flow rate)
    if (!VISUALIZABLE_TYPES.links.includes(link.category as any)) {
      continue;
    }
    
    items.push({
      key: String(link.key),
      displayName: getLinkDisplayName(link),
      type: 'edge',
    });
  }

  return items;
}

