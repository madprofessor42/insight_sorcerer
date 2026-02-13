/**
 * Selectable Items Utilities
 * 
 * Utilities for getting available nodes and edges for chart configuration.
 */

import type * as go from 'gojs';
import { VISUALIZABLE_TYPES } from './types';
import type { SimulationRunResult } from './types';
import { isLinkLabelNodeData, resolveNodeInfo, getLinkDisplayName } from '../diagram-data';

/**
 * Available node/edge item for selection in chart configuration
 */
export interface SelectableItem {
  key: string;
  displayName: string;
  type: 'node' | 'edge';
  isVectorElement?: boolean;
  parentKey?: string;
  vectorElement?: string;
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

/**
 * Get selectable items from simulation results.
 * This includes vector elements that were expanded during simulation.
 * 
 * @param result - Simulation results
 * @param nodeDataArray - Array of node data from diagram
 * @param linkDataArray - Array of link data from diagram
 * @returns Array of selectable items including vector elements
 */
export function getSelectableItemsFromResults(
  result: SimulationRunResult | null,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): SelectableItem[] {
  if (!result?.success || !result.series) {
    // Fallback to basic items if no results
    return getSelectableItems(nodeDataArray, linkDataArray);
  }

  const items: SelectableItem[] = [];
  const processedParents = new Set<string>();

  // Process all series keys from results
  for (const seriesKey of Object.keys(result.series)) {
    // Check if this is a vector element (format: key.vectorElement)
    const dotIndex = seriesKey.lastIndexOf('.');
    
    if (dotIndex > 0) {
      // This is a vector element
      const parentKey = seriesKey.substring(0, dotIndex);
      const vectorElement = seriesKey.substring(dotIndex + 1);
      
      // Find the parent node or link
      const node = nodeDataArray.find(n => String(n.key) === parentKey);
      const link = linkDataArray.find(l => String(l.key) === parentKey);
      
      if (node && !isLinkLabelNodeData(node)) {
        const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
        items.push({
          key: seriesKey,
          displayName: `${nodeInfo.name}.${vectorElement}`,
          type: 'node',
          isVectorElement: true,
          parentKey: parentKey,
          vectorElement: vectorElement,
        });
        processedParents.add(parentKey);
      } else if (link) {
        const linkName = getLinkDisplayName(link);
        items.push({
          key: seriesKey,
          displayName: `${linkName}.${vectorElement}`,
          type: 'edge',
          isVectorElement: true,
          parentKey: parentKey,
          vectorElement: vectorElement,
        });
        processedParents.add(parentKey);
      }
    } else {
      // This is a regular scalar value
      const node = nodeDataArray.find(n => String(n.key) === seriesKey);
      const link = linkDataArray.find(l => String(l.key) === seriesKey);
      
      if (node && !isLinkLabelNodeData(node)) {
        const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
        items.push({
          key: seriesKey,
          displayName: nodeInfo.name,
          type: 'node',
        });
      } else if (link) {
        items.push({
          key: seriesKey,
          displayName: getLinkDisplayName(link),
          type: 'edge',
        });
      }
    }
  }

  return items;
}

/**
 * Get selectable items from saved series keys.
 * This is used to restore vector elements after page reload when no simulation results exist yet.
 * 
 * @param seriesKeys - Array of series keys from last simulation
 * @param nodeDataArray - Array of node data from diagram
 * @param linkDataArray - Array of link data from diagram
 * @returns Array of selectable items
 */
export function getSelectableItemsFromSeriesKeys(
  seriesKeys: string[],
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): SelectableItem[] {
  const items: SelectableItem[] = [];

  for (const seriesKey of seriesKeys) {
    // Check if this is a vector element (format: key.vectorElement)
    const dotIndex = seriesKey.lastIndexOf('.');
    
    if (dotIndex > 0) {
      // This is a vector element
      const parentKey = seriesKey.substring(0, dotIndex);
      const vectorElement = seriesKey.substring(dotIndex + 1);
      
      // Find the parent node or link
      const node = nodeDataArray.find(n => String(n.key) === parentKey);
      const link = linkDataArray.find(l => String(l.key) === parentKey);
      
      if (node && !isLinkLabelNodeData(node)) {
        const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
        items.push({
          key: seriesKey,
          displayName: `${nodeInfo.name}.${vectorElement}`,
          type: 'node',
          isVectorElement: true,
          parentKey: parentKey,
          vectorElement: vectorElement,
        });
      } else if (link) {
        const linkName = getLinkDisplayName(link);
        items.push({
          key: seriesKey,
          displayName: `${linkName}.${vectorElement}`,
          type: 'edge',
          isVectorElement: true,
          parentKey: parentKey,
          vectorElement: vectorElement,
        });
      }
    } else {
      // This is a regular scalar value
      const node = nodeDataArray.find(n => String(n.key) === seriesKey);
      const link = linkDataArray.find(l => String(l.key) === seriesKey);
      
      if (node && !isLinkLabelNodeData(node)) {
        const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
        items.push({
          key: seriesKey,
          displayName: nodeInfo.name,
          type: 'node',
        });
      } else if (link) {
        items.push({
          key: seriesKey,
          displayName: getLinkDisplayName(link),
          type: 'edge',
        });
      }
    }
  }

  return items;
}
