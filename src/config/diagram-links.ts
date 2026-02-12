/**
 * Link configurations and utilities
 */

import type { LinkConfiguration, LinkType } from './diagram-types';

/**
 * ALL LINK CONFIGURATIONS
 * Single source of truth for everything about link types
 * To add a new link type, just add a new entry here - no other files need to be changed!
 */
export const LINK_CONFIGURATIONS: LinkConfiguration[] = [
  {
    id: 'link',
    
    ui: {
      label: 'Link',
      previewClassName: 'linkStyle',
      description: 'Influence link - shows dependencies between elements'
    },
    
    style: {
      stroke: '#666',
      strokeWidth: 2,
      arrowScale: 1.3,
      clickAreaWidth: 12,
      toShortLength: 4,
      fromShortLength: 4
    },
    
    displayProperties: [
      {
        dataKey: 'text',
        label: 'Name',
        editable: true,
        defaultValue: 'Link',
        segmentOffset: { x: 0, y: -10 },
        editorType: 'text'
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'text'
      }
    ],
    
    allowedFromNodes: [], // Can connect from any node type
    allowedToNodes: [], // Can connect to any node type
    allowedFromEdges: ['flow'], // Link can originate FROM a flow edge (via label node)
    allowedToEdges: ['flow'], // Link can connect TO a flow edge (via label node)
    canBeBidirectional: true, // Link can be bidirectional - single link with two arrows
    canEndOnCanvas: false // Regular links must connect to nodes
  },
  {
    id: 'flow',
    
    ui: {
      label: 'Flow',
      previewClassName: 'flowStyle',
      description: 'Flow link - shows material/information flow between stocks'
    },
    
    style: {
      stroke: '#4A90E2',
      strokeWidth: 6,
      arrowScale: 2.0,
      clickAreaWidth: 14,
      toShortLength: 8,
      fromShortLength: 8
    },
    
    displayProperties: [
      {
        dataKey: 'text',
        label: 'Name',
        editable: true,
        defaultValue: 'Flow',
        segmentOffset: { x: 0, y: -10 },
        editorType: 'text'
        // segmentIndex and segmentFraction are omitted - will use middle of entire link (NaN)
      },
      {
        dataKey: 'flowRate',
        label: 'Flow Rate',
        editable: true,
        defaultValue: '',
        showAsTooltip: true, // Show in tooltip instead of on edge
        editorType: 'formula'
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true,
        editorType: 'text'
      }
    ],
    
    allowedFromNodes: ['Stock', 'Cloud'], // Can connect from Stock or Cloud (Cloud can be source when reversing link)
    allowedToNodes: ['Stock', 'Cloud'], // Can connect TO Stock or Cloud (Cloud is auto-created when drawing to canvas)
    allowedFromEdges: [], // Flow CANNOT originate from any edge
    allowedToEdges: [], // Flow CANNOT connect to any edge
    canBeBidirectional: false, // Flow cannot be bidirectional - creates 2 separate links
    canEndOnCanvas: true // Flow can end on canvas (toNode: null) - auto-creates Cloud node at endpoint
  }
];

/**
 * Default link type when category is not specified
 */
export const DEFAULT_LINK_TYPE: LinkType = 'link';

/**
 * Category used for label nodes that sit on links to enable edge-to-edge connections.
 * These are invisible GoJS nodes that act as ports on links.
 */
export const LINK_LABEL_CATEGORY = 'LinkLabel';

/**
 * Get configuration for a specific link type
 */
export function getLinkConfiguration(linkType: LinkType): LinkConfiguration | undefined {
  return LINK_CONFIGURATIONS.find(config => config.id === linkType);
}

/**
 * Get all available link types (for UI, selectors, etc.)
 */
export function getAllLinkTypes(): LinkType[] {
  return LINK_CONFIGURATIONS.map(config => config.id) as LinkType[];
}

/**
 * Normalize link type - returns the actual type or default if undefined
 * This is the only helper function that can be used by UI components
 */
export function normalizeLinkType(category: string | undefined): LinkType {
  return (category || DEFAULT_LINK_TYPE) as LinkType;
}

/**
 * Check if a link type supports connections FROM edges (has allowedFromEdges)
 */
export function canLinkFromEdge(linkType: LinkType): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return false;
  return config.allowedFromEdges.length > 0;
}

/**
 * Check if a link type supports connections TO edges (has allowedToEdges)
 */
export function canLinkToEdge(linkType: LinkType): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return false;
  return config.allowedToEdges.length > 0;
}

/**
 * Check if a given link type can originate FROM a specific edge type
 */
export function isValidEdgeSource(linkType: LinkType, edgeCategory: string): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return false;
  return config.allowedFromEdges.includes(edgeCategory);
}

/**
 * Check if a given link type can connect TO a specific edge type
 */
export function isValidEdgeTarget(linkType: LinkType, edgeCategory: string): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return false;
  return config.allowedToEdges.includes(edgeCategory);
}

/**
 * Check if any link configuration supports edge-to-edge connections.
 * Used to determine whether to set up label nodes and linkLabelKeysProperty.
 */
export function hasAnyEdgeToEdgeSupport(): boolean {
  return LINK_CONFIGURATIONS.some(
    config => config.allowedFromEdges.length > 0 || config.allowedToEdges.length > 0
  );
}

/**
 * Check if a specific link type needs a label node on it.
 * A link needs a label node if ANY other link type references it
 * in their allowedFromEdges or allowedToEdges.
 * E.g., if 'link' has allowedFromEdges: ['flow'], then 'flow' needs a label node.
 */
export function linkTypeNeedsLabelNode(linkTypeId: string): boolean {
  return LINK_CONFIGURATIONS.some(
    config => config.allowedFromEdges.includes(linkTypeId) || config.allowedToEdges.includes(linkTypeId)
  );
}

