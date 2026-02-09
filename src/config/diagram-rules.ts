/**
 * Node types available in the diagram
 */
export type NodeType = 'Stock' | 'Variable' | 'Cloud';

/**
 * Node types that can be created manually by user
 * Cloud nodes are created automatically only when linking to canvas
 */
export type ManuallyCreatableNodeType = 'Stock' | 'Variable';

/**
 * GoJS visual styles for a link
 */
export interface LinkVisualStyle {
  /** Main stroke color */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Arrow scale */
  arrowScale: number;
  /** Width of invisible click area */
  clickAreaWidth: number;
  /** ToShortLength - shortens path to prevent interfering with arrowhead */
  toShortLength: number;
  /** FromShortLength - same for bidirectional arrows */
  fromShortLength: number;
}

/**
 * UI metadata for displaying link type in sidebar
 */
export interface LinkUIMetadata {
  /** Display label for UI */
  label: string;
  /** CSS class name for styling preview */
  previewClassName: string;
  /** Description (optional, for tooltips) */
  description?: string;
}

/**
 * Complete link configuration
 * Single source of truth for ALL link type settings
 */
export interface LinkConfiguration {
  /** Unique identifier for this link type */
  id: string;
  
  // UI Metadata
  ui: LinkUIMetadata;
  
  // Visual Styles
  style: LinkVisualStyle;
  
  // Validation Rules
  /** Allowed source node types (empty array means all types allowed) */
  allowedFromNodes: NodeType[];
  /** Allowed target node types (empty array means all types allowed) */
  allowedToNodes: NodeType[];
  /** Can this link type be bidirectional (single link with two arrows) */
  canBeBidirectional: boolean;
  /** Can this link type end on canvas (toNode: null) - automatically creates Cloud node at endpoint */
  canEndOnCanvas: boolean;
  /** Error message when source node is invalid */
  errorMessageFrom?: string;
  /** Error message when target node is invalid */
  errorMessageTo?: string;
}

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
    
    allowedFromNodes: [], // Can connect from any node type
    allowedToNodes: [], // Can connect to any node type
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
    
    allowedFromNodes: ['Stock', 'Cloud'], // Can connect from Stock or Cloud (Cloud can be source when reversing link)
    allowedToNodes: ['Stock', 'Cloud'], // Can connect TO Stock or Cloud (Cloud is auto-created when drawing to canvas)
    canBeBidirectional: false, // Flow cannot be bidirectional - creates 2 separate links
    canEndOnCanvas: true, // Flow can end on canvas (toNode: null) - auto-creates Cloud node at endpoint
    errorMessageFrom: 'Flow links can only be created FROM Stock or Cloud nodes',
    errorMessageTo: 'Flow links can only connect TO Stock or Cloud nodes'
  }
];

/**
 * Generate LinkType from configurations
 * This makes LinkType dynamic - add new type to LINK_CONFIGURATIONS and it's automatically available
 */
export type LinkType = typeof LINK_CONFIGURATIONS[number]['id'];

/**
 * Default link type when category is not specified
 */
export const DEFAULT_LINK_TYPE: LinkType = 'link';

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
  return LINK_CONFIGURATIONS.map(config => config.id);
}

/**
 * Validate if a link can be created from a specific node type
 */
export function isValidLinkSource(linkType: LinkType, fromNodeType: string): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // No config = allow all
  
  // Empty array means all types are allowed
  if (config.allowedFromNodes.length === 0) return true;
  
  return config.allowedFromNodes.includes(fromNodeType as NodeType);
}

/**
 * Validate if a link can be created to a specific node type
 */
export function isValidLinkTarget(linkType: LinkType, toNodeType: string): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // No config = allow all
  
  // Empty array means all types are allowed
  if (config.allowedToNodes.length === 0) return true;
  
  return config.allowedToNodes.includes(toNodeType as NodeType);
}

/**
 * Get error message for source node validation
 */
export function getLinkValidationErrorFrom(linkType: LinkType): string {
  const config = getLinkConfiguration(linkType);
  if (!config) return 'Invalid link source';
  
  if (config.errorMessageFrom) return config.errorMessageFrom;
  
  // Generate default message based on allowed nodes
  if (config.allowedFromNodes.length > 0) {
    return `Links of type '${linkType}' can only be created from: ${config.allowedFromNodes.join(', ')}`;
  }
  
  return 'Invalid link source';
}

/**
 * Get error message for target node validation
 */
export function getLinkValidationErrorTo(linkType: LinkType): string {
  const config = getLinkConfiguration(linkType);
  if (!config) return 'Invalid link target';
  
  if (config.errorMessageTo) return config.errorMessageTo;
  
  // Generate default message based on allowed nodes
  if (config.allowedToNodes.length > 0) {
    return `Links of type '${linkType}' can only connect to: ${config.allowedToNodes.join(', ')}`;
  }
  
  return 'Invalid link target';
}

/**
 * Check if a link type can be bidirectional
 */
export function canLinkBeBidirectional(linkType: LinkType): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // Default to true if no config exists
  
  return config.canBeBidirectional;
}

/**
 * Normalize link type - returns the actual type or default if undefined
 */
export function normalizeLinkType(category: string | undefined): LinkType {
  return (category || DEFAULT_LINK_TYPE) as LinkType;
}

/**
 * Check if two links are of the same type
 */
export function isSameLinkType(type1: string | undefined, type2: string | undefined): boolean {
  return normalizeLinkType(type1) === normalizeLinkType(type2);
}

/**
 * Check if a link type can end on canvas (toNode: null)
 * When true, a Cloud node will be automatically created at the endpoint
 */
export function canLinkEndOnCanvas(linkType: LinkType): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return false; // Default to false if no config exists
  
  return config.canEndOnCanvas;
}
