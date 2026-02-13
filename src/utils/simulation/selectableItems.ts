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
 * Parsed vector key information
 */
export interface ParsedVectorKey {
  isVector: boolean;
  parentKey: string;
  vectorElement?: string;
  originalKey: string;
}

/**
 * Parse a series key to determine if it's a vector element.
 * Single source of truth for vector key parsing logic.
 * 
 * Format: "parentKey.vectorElement" for vectors, or just "key" for scalars
 * 
 * @param key - Series key to parse
 * @returns Parsed key information
 */
export function parseVectorKey(key: string): ParsedVectorKey {
  const dotIndex = key.lastIndexOf('.');
  
  if (dotIndex > 0) {
    // Vector element format: "parentKey.vectorElement"
    return {
      isVector: true,
      parentKey: key.substring(0, dotIndex),
      vectorElement: key.substring(dotIndex + 1),
      originalKey: key,
    };
  }
  
  // Scalar value
  return {
    isVector: false,
    parentKey: key,
    originalKey: key,
  };
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
 * Create a selectable item from a series key (unified implementation).
 * Single source of truth for converting series keys to selectable items.
 * 
 * @param seriesKey - Series key from simulation results
 * @param nodeDataArray - Array of node data from diagram
 * @param linkDataArray - Array of link data from diagram
 * @returns SelectableItem or null if parent not found
 */
function createSelectableItemFromKey(
  seriesKey: string,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): SelectableItem | null {
  const parsed = parseVectorKey(seriesKey);
  
  // Find the parent node or link
  const node = nodeDataArray.find(n => String(n.key) === parsed.parentKey);
  const link = linkDataArray.find(l => String(l.key) === parsed.parentKey);
  
  if (node && !isLinkLabelNodeData(node)) {
    const nodeInfo = resolveNodeInfo(node.key, nodeDataArray);
    const displayName = parsed.isVector 
      ? `${nodeInfo.name}.${parsed.vectorElement}`
      : nodeInfo.name;
    
    return {
      key: seriesKey,
      displayName,
      type: 'node',
      isVectorElement: parsed.isVector,
      parentKey: parsed.isVector ? parsed.parentKey : undefined,
      vectorElement: parsed.vectorElement,
    };
  }
  
  if (link) {
    const linkName = getLinkDisplayName(link);
    const displayName = parsed.isVector
      ? `${linkName}.${parsed.vectorElement}`
      : linkName;
    
    return {
      key: seriesKey,
      displayName,
      type: 'edge',
      isVectorElement: parsed.isVector,
      parentKey: parsed.isVector ? parsed.parentKey : undefined,
      vectorElement: parsed.vectorElement,
    };
  }
  
  return null;
}

/**
 * Get selectable items from a list of series keys.
 * Unified implementation that works with any source of series keys.
 * 
 * @param seriesKeys - Array of series keys
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
    const item = createSelectableItemFromKey(seriesKey, nodeDataArray, linkDataArray);
    if (item) {
      items.push(item);
    }
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

  const seriesKeys = Object.keys(result.series);
  return getSelectableItemsFromSeriesKeys(seriesKeys, nodeDataArray, linkDataArray);
}

/**
 * Get available items for chart configuration.
 * Handles the complex logic of merging base items with vector elements
 * and filtering out base items that have been expanded into vectors.
 * 
 * This is the main function to use for getting available items in chart configuration UI.
 * 
 * @param nodeDataArray - Array of node data from diagram
 * @param linkDataArray - Array of link data from diagram
 * @param simulationResult - Optional simulation results (if simulation has run)
 * @param lastSimulationSeriesKeys - Optional saved series keys from previous simulation
 * @returns Array of available selectable items
 */
export function getAvailableChartItems(
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>,
  simulationResult?: SimulationRunResult | null,
  lastSimulationSeriesKeys?: string[]
): SelectableItem[] {
  // Start with base items (always available for pre-simulation configuration)
  const baseItems = getSelectableItems(nodeDataArray, linkDataArray);
  const itemsMap = new Map<string, SelectableItem>();
  
  // Add base items to map
  baseItems.forEach(item => itemsMap.set(item.key, item));
  
  // Add vector elements from simulation results or saved keys
  if (simulationResult?.success) {
    const vectorItems = getSelectableItemsFromResults(simulationResult, nodeDataArray, linkDataArray)
      .filter(item => item.isVectorElement); // Only vector elements, not duplicate base items
    
    vectorItems.forEach(item => itemsMap.set(item.key, item));
  } else if (lastSimulationSeriesKeys && lastSimulationSeriesKeys.length > 0) {
    // No current simulation results, but we have saved series keys from last run
    const savedItems = getSelectableItemsFromSeriesKeys(lastSimulationSeriesKeys, nodeDataArray, linkDataArray);
    savedItems.forEach(item => {
      if (!itemsMap.has(item.key)) {
        itemsMap.set(item.key, item);
      }
    });
  }
  
  // Filter out base items that have been expanded into vector elements
  // This prevents showing both "Population" and "Population.USA", "Population.Mexico", etc.
  const allItems = Array.from(itemsMap.values());
  const vectorElementParents = new Set(
    allItems
      .filter(item => item.isVectorElement)
      .map(item => item.parentKey)
      .filter(Boolean) as string[]
  );
  
  const filteredItems = allItems.filter(item => 
    // Keep item if it's a vector element OR if it's a base item without vector expansions
    item.isVectorElement || !vectorElementParents.has(item.key)
  );
  
  return filteredItems;
}
