import * as go from 'gojs';
import type { LinkType } from '../store/diagramSlice';
import { 
  isValidLinkSource, 
  isValidLinkTarget, 
  getLinkValidationErrorFrom,
  getLinkValidationErrorTo
} from '../config/diagram-rules';

/**
 * Create link validation function for linking tool
 * Uses configuration from diagram-rules.ts - no hardcoded logic!
 */
export function createLinkValidation(linkType: LinkType) {
  return (
    fromNode: go.Node | null,
    _fromPort: go.GraphObject | null,
    toNode: go.Node | null,
    _toPort: go.GraphObject | null
  ): boolean => {
    if (!fromNode) return false;
    
    const fromNodeType = fromNode.data.category;
    const toNodeType = toNode?.data.category;
    
    // Validate source node
    if (!isValidLinkSource(linkType, fromNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorFrom(linkType)}!`);
      return false;
    }
    
    // Validate target node (if target is known)
    if (toNode && !isValidLinkTarget(linkType, toNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorTo(linkType)}!`);
      return false;
    }
    
    return true;
  };
}

/**
 * Create link validation function for relinking tool
 * Uses configuration from diagram-rules.ts - no hardcoded logic!
 */
export function createRelinkValidation() {
  return (
    fromNode: go.Node | null,
    _fromPort: go.GraphObject | null,
    toNode: go.Node | null,
    _toPort: go.GraphObject | null,
    link: go.Link | null
  ): boolean => {
    if (!fromNode || !link) return false;
    
    const linkType = link.data.category as LinkType;
    const fromNodeType = fromNode.data.category;
    const toNodeType = toNode?.data.category;
    
    // Validate source node
    if (!isValidLinkSource(linkType, fromNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorFrom(linkType)}!`);
      return false;
    }
    
    // Validate target node (if target is known)
    if (toNode && !isValidLinkTarget(linkType, toNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorTo(linkType)}!`);
      return false;
    }
    
    return true;
  };
}

