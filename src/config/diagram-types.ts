/**
 * Core type definitions for diagram elements
 */

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
 * Configuration for a single property to display on a node
 */
export interface NodePropertyDisplay {
  /** Property key in node data (e.g., 'name' for Name, 'initialValue' for Initial Value, 'note' for Note) */
  dataKey: string;
  /** Display label for the property */
  label: string;
  /** Whether this property should be editable inline */
  editable?: boolean;
  /** Default value if property is not set */
  defaultValue?: string;
  /** Show this property as tooltip on hover (instead of visible on node) */
  showAsTooltip?: boolean;
  /** Show this property as the main text label on the node */
  showAsMainLabel?: boolean;
  /** Input type for the editor */
  editorType?: 'text' | 'formula';
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
  
  /** Properties to display on node or in tooltip */
  displayProperties: NodePropertyDisplay[];
  
  /** Whether this node can be manually created by user (false for Cloud) */
  manuallyCreatable: boolean;
  
  /** Custom click behavior (for Cloud - select node + connected links) */
  selectConnectedLinksOnClick?: boolean;
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
  /** Input type for the editor */
  editorType?: 'text' | 'formula';
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
  /**
   * Allowed source EDGE types for edge-to-edge connections.
   * Lists which edge (link) categories this link can originate FROM via label nodes.
   * Empty array means this link type CANNOT originate from any edge.
   * Example: ['flow'] means this link can start from a flow edge's label node.
   */
  allowedFromEdges: string[];
  /**
   * Allowed target EDGE types for edge-to-edge connections.
   * Lists which edge (link) categories this link can connect TO via label nodes.
   * Empty array means this link type CANNOT connect to any edge.
   * Example: ['flow'] means this link can end at a flow edge's label node.
   */
  allowedToEdges: string[];
  /** Can this link type be bidirectional (single link with two arrows) */
  canBeBidirectional: boolean;
  /** Can this link type end on canvas (toNode: null) - automatically creates Cloud node at endpoint */
  canEndOnCanvas: boolean;
}

/**
 * Reference configuration for formula fields
 * Defines what references should be shown in formula input bubbles
 * 
 * Fully configurable - specify which LINK types to use for connections.
 * No hardcoded types - everything is driven by configuration.
 * 
 * The arrays specify which LINK TYPES to include (not node/edge types).
 * E.g., incoming: ['link'] means "show all incoming connections made via 'link' type"
 * 
 * The code automatically resolves:
 * - For nodes: connections to/from this node
 * - For edges: connections to/from this edge's LinkLabel
 * 
 * Whether connection leads to node or edge is resolved automatically.
 */
export interface ReferenceConfig {
  /** 
   * Incoming connections via specified link types
   * For nodes: connections TO this node
   * For edges: connections TO this edge's LinkLabel
   */
  incoming?: string[];
  
  /** 
   * Outgoing connections via specified link types
   * For nodes: connections FROM this node
   * For edges: connections FROM this edge's LinkLabel
   */
  outgoing?: string[];
  
  /**
   * Include the incoming connecting edges themselves (not just the elements they connect from)
   * Array of edge types to include as references
   * E.g., Variable -> link -> Stock
   * - Without: shows only Variable
   * - With ['link']: shows Variable AND the incoming link itself
   */
  includeIncomingConnectingEdges?: string[];
  
  /**
   * Include the outgoing connecting edges themselves (not just the elements they connect to)
   * Array of edge types to include as references
   * E.g., Stock -> link -> Variable
   * - Without: shows only Variable
   * - With ['link']: shows Variable AND the outgoing link itself
   */
  includeOutgoingConnectingEdges?: string[];
  
  // === Additional flags for Edges only ===
  /** Include the source node of this edge (from node) */
  includeSourceNode?: boolean;
  /** Include the target node of this edge (to node) */
  includeTargetNode?: boolean;
}

