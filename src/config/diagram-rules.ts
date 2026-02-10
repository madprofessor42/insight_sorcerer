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
 * GoJS shape types for nodes
 */
export type NodeShapeType = 'Rectangle' | 'Ellipse' | 'RoundedRectangle' | 'FlowCloud';

/**
 * GoJS visual styles for a node
 */
export interface NodeVisualStyle {
  /** Shape type (Rectangle, Ellipse, RoundedRectangle, FlowCloud) */
  shape: NodeShapeType;
  /** Fill color */
  fill: string;
  /** Stroke (border) color */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Width of the node */
  width: number;
  /** Height of the node */
  height: number;
  /** Text color */
  textColor: string;
  /** Font for text */
  font: string;
  /** Whether text is editable */
  textEditable: boolean;
  /** Default text value */
  defaultText?: string;
}

/**
 * Port configuration for node
 */
export interface NodePortConfig {
  /** Whether to show center port for linking */
  showCenterPort: boolean;
  /** Center port fill color */
  centerPortFill?: string;
  /** Center port stroke color */
  centerPortStroke?: string;
  /** Center port size */
  centerPortSize?: number;
  /** Whether links can originate from this node */
  fromLinkable: boolean;
  /** Whether links can end at this node */
  toLinkable: boolean;
}

/**
 * Complete node configuration
 * Single source of truth for ALL node type settings
 */
export interface NodeConfiguration {
  /** Unique identifier for this node type */
  id: NodeType;
  
  /** Display label for UI */
  label: string;
  
  /** Description (for tooltips, etc.) */
  description?: string;
  
  /** Visual styles */
  style: NodeVisualStyle;
  
  /** Port configuration */
  port: NodePortConfig;
  
  /** Whether this node can be manually created by user (false for Cloud) */
  manuallyCreatable: boolean;
  
  /** Custom click behavior (for Cloud - select node + connected links) */
  selectConnectedLinksOnClick?: boolean;
}

/**
 * ALL NODE CONFIGURATIONS
 * Single source of truth for everything about node types
 * To add a new node type, just add a new entry here!
 */
export const NODE_CONFIGURATIONS: NodeConfiguration[] = [
  {
    id: 'Stock',
    label: 'Stock',
    description: 'Stock node - represents an accumulation or reservoir',
    
    style: {
      shape: 'Rectangle',
      fill: '#4A90E2',
      stroke: '#2E5C8A',
      strokeWidth: 2,
      width: 120,
      height: 60,
      textColor: 'white',
      font: 'bold 14px sans-serif',
      textEditable: true,
      defaultText: 'Stock'
    },
    
    port: {
      showCenterPort: true,
      centerPortFill: '#2E5C8A',
      centerPortStroke: '#1E3C5A',
      centerPortSize: 20,
      fromLinkable: true,
      toLinkable: true
    },
    
    manuallyCreatable: true
  },
  {
    id: 'Variable',
    label: 'Variable',
    description: 'Variable node - represents a calculated value or parameter',
    
    style: {
      shape: 'Ellipse',
      fill: '#50C878',
      stroke: '#2E7D4E',
      strokeWidth: 2,
      width: 100,
      height: 100,
      textColor: 'white',
      font: 'bold 14px sans-serif',
      textEditable: true,
      defaultText: 'Variable'
    },
    
    port: {
      showCenterPort: true,
      centerPortFill: '#2E7D4E',
      centerPortStroke: '#1E5D3E',
      centerPortSize: 20,
      fromLinkable: true,
      toLinkable: true
    },
    
    manuallyCreatable: true
  },
  {
    id: 'Cloud',
    label: 'Cloud',
    description: 'Cloud node - automatically created endpoint for flows',
    
    style: {
      shape: 'FlowCloud',
      fill: 'white',
      stroke: '#4A90E2',
      strokeWidth: 2,
      width: 80,
      height: 64,
      textColor: '#4A90E2',
      font: 'bold 12px sans-serif',
      textEditable: true,
      defaultText: ''
    },
    
    port: {
      showCenterPort: false, // Cloud has no visible center port
      fromLinkable: false, // Cannot initiate links
      toLinkable: false // Cannot initiate links (but can be target/source when reversing)
    },
    
    manuallyCreatable: false, // Cloud is only created automatically
    selectConnectedLinksOnClick: true // Select Cloud + its links when clicked
  }
];

/**
 * Get configuration for a specific node type
 */
export function getNodeConfiguration(nodeType: NodeType): NodeConfiguration | undefined {
  return NODE_CONFIGURATIONS.find(config => config.id === nodeType);
}

/**
 * Get all manually creatable node types (for UI, sidebar, etc.)
 */
export function getManuallyCreatableNodeTypes(): ManuallyCreatableNodeType[] {
  return NODE_CONFIGURATIONS
    .filter(config => config.manuallyCreatable)
    .map(config => config.id) as ManuallyCreatableNodeType[];
}

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
 * Configuration for a single property to display on a link
 */
export interface LinkPropertyDisplay {
  /** Property key in link data (e.g., 'text' for Name, 'flowRate' for Flow Rate, 'note' for Note) */
  dataKey: string;
  /** Display label for the property */
  label: string;
  /** Whether this property should be editable inline */
  editable?: boolean;
  /** Default value if property is not set */
  defaultValue?: string;
  /** Show this property as tooltip on hover (instead of label on link) */
  showAsTooltip?: boolean;
  /** Segment offset for positioning the label on the link (only for non-tooltip properties) */
  segmentOffset?: { x: number; y: number };
  /** Segment index (which segment of the link to place the label on, 0 = middle) */
  segmentIndex?: number;
  /** Segment fraction (0.0 to 1.0, where along the segment to place the label) */
  segmentFraction?: number;
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
  
  // Display Configuration
  /** Properties to display as labels on link or in tooltip */
  displayProperties: LinkPropertyDisplay[];
  
  // Validation Rules
  /** Allowed source node types (empty array means all types allowed) */
  allowedFromNodes: NodeType[];
  /** Allowed target node types (empty array means all types allowed) */
  allowedToNodes: NodeType[];
  /** Can this link type be bidirectional (single link with two arrows) */
  canBeBidirectional: boolean;
  /** Can this link type end on canvas (toNode: null) - automatically creates Cloud node at endpoint */
  canEndOnCanvas: boolean;
  // Note: Error messages are automatically generated based on allowedFromNodes and allowedToNodes
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
    
    displayProperties: [
      {
        dataKey: 'text',
        label: 'Name',
        editable: true,
        defaultValue: '',
        segmentOffset: { x: 0, y: -10 }
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true
      }
    ],
    
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
    
    displayProperties: [
      {
        dataKey: 'text',
        label: 'Name',
        editable: true,
        defaultValue: '',
        segmentOffset: { x: 0, y: -10 }
        // segmentIndex and segmentFraction are omitted - will use middle of entire link (NaN)
      },
      {
        dataKey: 'flowRate',
        label: 'Flow Rate',
        editable: true,
        defaultValue: '',
        showAsTooltip: true // Show in tooltip instead of on edge
      },
      {
        dataKey: 'note',
        label: 'Note',
        editable: true,
        defaultValue: '',
        showAsTooltip: true
      }
    ],
    
    allowedFromNodes: ['Stock', 'Cloud'], // Can connect from Stock or Cloud (Cloud can be source when reversing link)
    allowedToNodes: ['Stock', 'Cloud'], // Can connect TO Stock or Cloud (Cloud is auto-created when drawing to canvas)
    canBeBidirectional: false, // Flow cannot be bidirectional - creates 2 separate links
    canEndOnCanvas: true // Flow can end on canvas (toNode: null) - auto-creates Cloud node at endpoint
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
 * Normalize link type - returns the actual type or default if undefined
 * This is the only helper function that can be used by UI components
 */
export function normalizeLinkType(category: string | undefined): LinkType {
  return (category || DEFAULT_LINK_TYPE) as LinkType;
}
