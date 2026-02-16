/**
 * Core diagram data utilities.
 * 
 * This module contains fundamental utilities that are used across the entire application:
 * - Default value getters from configuration
 * - Type guards and category checks
 * - Basic node/link property getters
 * - Parent edge lookup for LinkLabel nodes
 * 
 * These utilities have NO dependencies on display formatting or simulation logic.
 * They are pure, reusable building blocks.
 */

import * as go from 'gojs';
import { 
  normalizeLinkType, 
  getLinkConfiguration, 
  getNodeConfiguration,
  LINK_LABEL_CATEGORY 
} from '../../config';
import type { LinkType, NodeType, DefaultValueContext } from '../../config';

// ============================================================================
// DEFAULT VALUE UTILITIES
// Single source of truth for getting default values from configuration
// ============================================================================

/**
 * Get the default value for a specific property from node configuration.
 * 
 * @param nodeType - The node category (e.g., 'Stock', 'Variable', 'Cloud')
 * @param propertyKey - The property data key (e.g., 'name', 'text')
 * @returns Default value from configuration, or empty string if not found
 */
export function getDefaultNodePropertyValue(
  nodeType: NodeType | undefined,
  propertyKey: string
): string {
  if (!nodeType) return '';
  
  const config = getNodeConfiguration(nodeType);
  if (!config) return '';
  
  const property = config.displayProperties.find(p => p.dataKey === propertyKey);
  return property?.defaultValue || '';
}

/**
 * Get the default value for a specific property from link configuration.
 * 
 * @param linkType - The link category (e.g., 'link', 'flow')
 * @param propertyKey - The property data key (e.g., 'text', 'flowRate')
 * @returns Default value from configuration, or empty string if not found
 */
export function getDefaultLinkPropertyValue(
  linkType: LinkType | undefined,
  propertyKey: string
): string {
  if (!linkType) return '';
  
  const config = getLinkConfiguration(linkType);
  if (!config) return '';
  
  const property = config.displayProperties.find(p => p.dataKey === propertyKey);
  return property?.defaultValue || '';
}

/**
 * Get the default name for a node type.
 * Shorthand for getting the 'name' property default value.
 * 
 * @param nodeType - The node category
 * @returns Default name from configuration
 */
export function getDefaultNodeName(nodeType: NodeType | undefined): string {
  return getDefaultNodePropertyValue(nodeType, 'name');
}

/**
 * Get the default text for a link type.
 * Shorthand for getting the 'text' property default value.
 * 
 * @param linkType - The link category
 * @returns Default text from configuration
 */
export function getDefaultLinkText(linkType: LinkType | undefined): string {
  return getDefaultLinkPropertyValue(linkType, 'text');
}

/**
 * Create node data object with all default values from configuration.
 * Supports both static defaultValue and dynamic defaultValueGenerator.
 * 
 * @param nodeType - The node category (e.g., 'Stock', 'Variable', 'Converter')
 * @param context - Context for dynamic value generation (simulation config, etc.)
 * @returns Object with all default property values from configuration
 * 
 * @example
 * const nodeData = getNodeDataWithDefaults('Converter', { simulationConfig });
 * // Returns: { name: 'Converter', values: '2000,30;2050,10;2100,100', ... }
 */
export function getNodeDataWithDefaults(
  nodeType: NodeType,
  context: DefaultValueContext
): Record<string, any> {
  const config = getNodeConfiguration(nodeType);
  if (!config) return { category: nodeType };
  
  const nodeData: Record<string, any> = {
    category: nodeType
  };
  
  // Populate all properties with their default values
  for (const property of config.displayProperties) {
    // Use generator if available, otherwise use static default
    if (property.defaultValueGenerator) {
      nodeData[property.dataKey] = property.defaultValueGenerator(context);
    } else if (property.defaultValue !== undefined) {
      nodeData[property.dataKey] = property.defaultValue;
    }
  }
  
  return nodeData;
}

// ============================================================================
// TYPE GUARDS AND CHECKS
// ============================================================================

/**
 * Check if a node data object represents a LinkLabel node.
 * LinkLabel nodes are invisible connection points on edges for edge-to-edge connections.
 *
 * @param nodeData - Node data object
 * @returns true if the node is a LinkLabel
 */
export function isLinkLabelNodeData(nodeData: go.ObjectData): boolean {
  return nodeData.category === LINK_LABEL_CATEGORY;
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

// ============================================================================
// BASIC PROPERTY GETTERS
// ============================================================================

/**
 * Get the display name of a node.
 * Falls back to default value from configuration if no name is set.
 * 
 * @param nodeData - Node data object from Redux store
 * @returns Display name string
 */
export function getNodeDisplayName(nodeData: go.ObjectData): string {
  const name = (nodeData.name as string) || (nodeData.text as string);
  if (name && name.trim() !== '') {
    return name;
  }
  
  // Fallback to default value from configuration
  const category = nodeData.category as NodeType | undefined;
  return getDefaultNodeName(category) || category || '(unnamed)';
}

/**
 * Get the display name of a link.
 * Falls back to default value from configuration if no text is set.
 * 
 * @param linkData - Link data object from Redux store
 * @returns Display name string
 */
export function getLinkDisplayName(linkData: go.ObjectData): string {
  const text = linkData.text as string;
  if (text && text.trim() !== '') {
    return text;
  }
  
  // Fallback to default value from configuration
  const type = getLinkType(linkData);
  return getDefaultLinkText(type) || type || '(unnamed)';
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

// ============================================================================
// PARENT EDGE LOOKUP
// ============================================================================

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
 * Find the LinkLabel node for a given edge (link).
 * This is the reverse of findParentEdgeForLabelNode.
 * 
 * @param edgeKey - Key of the edge (link)
 * @param nodeDataArray - Array of node data objects from Redux store
 * @param linkDataArray - Array of link data objects from Redux store
 * @returns LinkLabel node data object or null if not found
 */
export function findLinkLabelForEdge(
  edgeKey: go.Key,
  nodeDataArray: Array<go.ObjectData>,
  linkDataArray: Array<go.ObjectData>
): go.ObjectData | null {
  // Find the edge first
  const edge = linkDataArray.find(link => link.key === edgeKey);
  if (!edge) return null;
  
  // Get labelKeys array from the edge
  const labelKeys = edge.labelKeys;
  if (!Array.isArray(labelKeys) || labelKeys.length === 0) return null;
  
  // Find the LinkLabel node with matching key (usually first element)
  const labelNodeKey = labelKeys[0];
  return nodeDataArray.find(node => 
    node.key === labelNodeKey && isLinkLabelNodeData(node)
  ) ?? null;
}

