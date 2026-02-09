/**
 * Centralized link validation utilities
 * All link validation logic in one place for better maintainability
 */

import * as go from 'gojs';
import type { LinkType } from '../store/diagramSlice';
import { 
  isSameLinkType,
  isValidLinkSource, 
  isValidLinkTarget, 
  getLinkValidationErrorFrom,
  getLinkValidationErrorTo,
  canLinkEndOnCanvas
} from '../config/diagram-rules';

// ============================================================================
// BASIC LINK CHECKS
// ============================================================================

/**
 * Check if a duplicate link of the same type already exists between two nodes
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link to check
 * @param excludeLinkKey - Optional link key to exclude from check (for relinking)
 * @returns true if duplicate exists, false otherwise
 */
export function hasDuplicateLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  excludeLinkKey?: go.Key
): boolean {
  return model.linkDataArray.some(
    (ld: go.ObjectData) => 
      ld.from === fromKey && 
      ld.to === toKey && 
      isSameLinkType(ld.category, linkType) &&
      (excludeLinkKey === undefined || ld.key !== excludeLinkKey)
  );
}

/**
 * Find a reverse link of the same type between two nodes
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link to check
 * @param excludeLinkKey - Optional link key to exclude from search
 * @returns The reverse link data if found, undefined otherwise
 */
export function findReverseLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  excludeLinkKey?: go.Key
): go.ObjectData | undefined {
  return model.linkDataArray.find(
    (ld: go.ObjectData) => 
      ld.from === toKey && 
      ld.to === fromKey && 
      isSameLinkType(ld.category, linkType) &&
      (excludeLinkKey === undefined || ld.key !== excludeLinkKey)
  );
}

// ============================================================================
// LINK OPERATION VALIDATORS
// ============================================================================

/**
 * Check if a link can be created between two nodes
 * Validates both node types and checks for duplicates
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link to create
 * @returns true if link can be created, false otherwise
 */
export function canCreateLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: LinkType
): boolean {
  // Check for duplicate links
  if (hasDuplicateLink(model, fromKey, toKey, linkType)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a link can be relinked to new nodes
 * Validates both node types and checks for duplicates (excluding the link being relinked)
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - New source node key
 * @param toKey - New target node key
 * @param linkType - Type of the link
 * @param linkKey - Key of the link being relinked
 * @returns true if link can be relinked, false otherwise
 */
export function canRelinkToNodes(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: LinkType,
  linkKey: go.Key
): boolean {
  // Check for duplicate links (excluding current link)
  if (hasDuplicateLink(model, fromKey, toKey, linkType, linkKey)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a link can be reversed without creating a duplicate
 * and without violating validation rules
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Current source node key
 * @param toKey - Current target node key
 * @param linkType - Type of the link
 * @param linkKey - Key of the link to reverse
 * @returns true if link can be reversed, false if reverse would create duplicate or violate rules
 */
export function canReverseLink(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  linkKey: go.Key
): boolean {
  // Check if reversing (toKey -> fromKey) would create a duplicate
  // by checking if a link already exists from toKey to fromKey (excluding current link)
  if (hasDuplicateLink(model, toKey, fromKey, linkType, linkKey)) {
    return false;
  }
  
  // Check if reversed direction would violate validation rules
  // After reverse: toNode becomes source, fromNode becomes target
  const fromNodeData = model.findNodeDataForKey(fromKey);
  const toNodeData = model.findNodeDataForKey(toKey);
  
  if (!fromNodeData || !toNodeData) return false;
  
  const normalizedLinkType = linkType || 'link';
  
  // Validate that toNode can be a source (after reverse)
  if (!isValidLinkSource(normalizedLinkType as LinkType, toNodeData.category)) {
    return false;
  }
  
  // Validate that fromNode can be a target (after reverse)
  if (!isValidLinkTarget(normalizedLinkType as LinkType, fromNodeData.category)) {
    return false;
  }
  
  return true;
}

// ============================================================================
// GOJS VALIDATION FUNCTIONS
// ============================================================================

/**
 * Create link validation function for linking tool
 * Uses configuration from diagram-rules.ts - no hardcoded logic!
 */
export function createLinkValidation(linkType: LinkType) {
  return (
    fromNode: go.Node | null,
    _fromPort: go.GraphObject | null,
    toNode: go.Node | null,
    _toPort: go.GraphObject | null,
    _link: go.Link | null
  ): boolean => {
    if (!fromNode) return false;
    
    const fromNodeType = fromNode.data.category;
    const toNodeType = toNode?.data.category;
    
    // Validate source node
    if (!isValidLinkSource(linkType, fromNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorFrom(linkType)}!`);
      return false;
    }
    
    // Handle links ending on canvas (toNode: null)
    if (!toNode) {
      // Check if this link type can end on canvas
      if (!canLinkEndOnCanvas(linkType)) {
        console.warn(`⚠️ Links of type '${linkType}' cannot end on canvas`);
        return false;
      }
      
      // CRITICAL: Check if this link type can connect to Cloud nodes
      // (Cloud node will be auto-created when link ends on canvas)
      if (!isValidLinkTarget(linkType, 'Cloud')) {
        console.warn(`⚠️ ${getLinkValidationErrorTo(linkType)} (cannot create Cloud node)`);
        return false;
      }
      
      // Source validation passed and Cloud is allowed as target
      return true;
    }
    
    // Validate target node (if target is known)
    if (!isValidLinkTarget(linkType, toNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorTo(linkType)}!`);
      return false;
    }
    
    // Check for duplicate links of the same type
    if (toNode && fromNode.diagram) {
      const model = fromNode.diagram.model as go.GraphLinksModel;
      if (model instanceof go.GraphLinksModel) {
        if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType)) {
          console.warn(`⚠️ Duplicate link of type '${linkType}' already exists between these nodes`);
          return false;
        }
      }
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
    
    // Handle relinking to canvas (toNode: null)
    if (!toNode) {
      // Check if this link type can end on canvas
      if (!canLinkEndOnCanvas(linkType)) {
        console.warn(`⚠️ Links of type '${linkType}' cannot end on canvas`);
        return false;
      }
      
      // CRITICAL: Check if this link type can connect to Cloud nodes
      // (Cloud node will be auto-created when relink ends on canvas)
      if (!isValidLinkTarget(linkType, 'Cloud')) {
        console.warn(`⚠️ ${getLinkValidationErrorTo(linkType)} (cannot create Cloud node)`);
        return false;
      }
      
      // Source validation passed and Cloud is allowed as target
      return true;
    }
    
    // Validate target node (if target is known)
    if (!isValidLinkTarget(linkType, toNodeType)) {
      console.warn(`⚠️  ${getLinkValidationErrorTo(linkType)}!`);
      return false;
    }
    
    // Check for duplicate links of the same type (excluding current link being relinked)
    if (fromNode.diagram) {
      const model = fromNode.diagram.model as go.GraphLinksModel;
      if (model instanceof go.GraphLinksModel) {
        if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType, link.data.key)) {
          console.warn(`⚠️ Duplicate link of type '${linkType}' already exists between these nodes`);
          return false;
        }
      }
    }
    
    return true;
  };
}

