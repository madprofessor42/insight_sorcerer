// Export GoJS configuration utilities
export { initializeDiagram } from './gojs-config';

// Export GoJS template utilities
export {
  createNodeTemplateMap,
  createDefaultNodeTemplate,
  createLinkTemplateMap,
  createDefaultLinkTemplate
} from './gojs-templates';

// Export link validation utilities
export {
  hasDuplicateLink,
  findReverseLink,
  canCreateLink,
  canRelinkToNodes,
  canReverseLink,
  createLinkValidation,
  createRelinkValidation
} from './link-validation';

