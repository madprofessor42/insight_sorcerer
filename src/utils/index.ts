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
  createRelinkValidation
} from './link-validation';
export type { ValidationResult } from './link-validation';

// Export diagram access utilities
export {
  getDiagramFromDOM,
  findLinkByKey,
  withLink
} from './diagram-access';
export type { DiagramAccessResult } from './diagram-access';

