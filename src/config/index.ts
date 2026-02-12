/**
 * Diagram configuration module
 * Central export point for all diagram-related configurations and utilities
 */

// Types
export type {
  NodeType,
  ManuallyCreatableNodeType,
  LinkType,
  NodeShapeType,
  NodeVisualStyle,
  NodePropertyDisplay,
  NodePortConfig,
  NodeConfiguration,
  LinkVisualStyle,
  LinkUIMetadata,
  LinkPropertyDisplay,
  LinkConfiguration,
  AvailableReference,
  ReferenceConfig,
  DefaultValueContext,
} from './diagram-types';

// Node configurations and utilities
export {
  NODE_CONFIGURATIONS,
  getNodeConfiguration,
  getManuallyCreatableNodeTypes,
} from './diagram-nodes';

// Link configurations and utilities
export {
  LINK_CONFIGURATIONS,
  DEFAULT_LINK_TYPE,
  LINK_LABEL_CATEGORY,
  getLinkConfiguration,
  getAllLinkTypes,
  normalizeLinkType,
  canLinkFromEdge,
  canLinkToEdge,
  isValidEdgeSource,
  isValidEdgeTarget,
  hasAnyEdgeToEdgeSupport,
  linkTypeNeedsLabelNode,
} from './diagram-links';

// Reference configurations
export {
  REFERENCE_CONFIGURATIONS,
  getNodeReferenceConfig,
  getLinkReferenceConfig,
} from './diagram-references';

// Formula function types
export type {
  FormulaFunction,
  FunctionCategory,
} from './formula-types';

// Formula functions
export {
  FORMULA_FUNCTIONS,
} from './formula-functions';

// Color utilities
export {
  getTypeColor,
} from './diagram-colors';

