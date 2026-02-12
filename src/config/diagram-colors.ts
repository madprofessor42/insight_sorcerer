/**
 * Color utilities for diagram nodes and links
 * Single source of truth for type colors, extracted from configurations
 */

import { getNodeConfiguration } from './diagram-nodes';
import { getLinkConfiguration } from './diagram-links';
import type { NodeType, LinkType } from './diagram-types';

/**
 * Get the color for a given node or link type.
 * Extracts color from NODE_CONFIGURATIONS and LINK_CONFIGURATIONS.
 * Maintains single source of truth - no hardcoded colors.
 * 
 * @param type - The node or link type (Stock, Variable, Converter, Cloud, flow, link)
 * @returns Hex color code for the type
 */
export function getTypeColor(type: string): string {
  // Try to get color from link configuration
  const linkConfig = getLinkConfiguration(type as LinkType);
  if (linkConfig?.style.stroke) {
    return linkConfig.style.stroke;
  }
  
  // Try to get color from node configuration
  const nodeConfig = getNodeConfiguration(type as NodeType);
  if (nodeConfig?.style.fill) {
    return nodeConfig.style.fill;
  }
  
  // Default fallback for unknown types
  return '#666';
}

