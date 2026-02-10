// Export GoJS configuration utilities
export { initializeDiagram } from './gojs-config';

// Export GoJS template utilities
export {
  createNodeTemplateMap,
  createLinkTemplateMap
} from './gojs-templates';

// Export link validation utilities
export {
  hasDuplicateLink,
  findReverseLink,
  validateReverse,
  validateBidirectional,
  validateCanEndOnCanvas,
  createLinkValidation,
  createRelinkValidation,
  isLinkLabelNode,
  getParentLinkCategory
} from './link-validation';
export type { ValidationResult } from './link-validation';

// Export diagram access utilities
export {
  getDiagramFromDOM,
  findNodeByKey,
  findLinkByKey,
  withNode,
  withLink
} from './diagram-access';
export type { DiagramAccessResult } from './diagram-access';

// Export diagram data resolution utilities
export {
  resolveNodeInfo,
  getLinkDisplayName,
  getLinkType,
  isLinkBidirectional,
  getLinkDirectionSymbol,
  getLinkColor,
  getLinkLabel,
  resolveLinkInfo,
  // Edge-to-edge resolution utilities
  isLinkLabelNodeData,
  findParentEdgeForLabelNode,
  resolveEdgeInfo,
  resolveConnectionEndpoint,
  isEdgeEndpoint
} from './diagram-data';
export type {
  NodeDisplayInfo,
  EdgeDisplayInfo,
  ConnectionEndpointInfo,
  LinkDisplayInfo
} from './diagram-data';
