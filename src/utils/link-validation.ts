/**
 * Centralized link validation utilities
 * All link validation logic in one place for better maintainability
 */

import * as go from 'gojs';
import type { LinkType, NodeType } from '../config/diagram-rules';
import { 
  getLinkConfiguration,
  normalizeLinkType,
  DEFAULT_LINK_TYPE,
  LINK_LABEL_CATEGORY,
  isValidEdgeSource,
  isValidEdgeTarget
} from '../config/diagram-rules';

// ============================================================================
// INTERNAL CONSTRAINT FUNCTIONS
// These functions are copies from diagram-rules.ts but kept internal
// All validation logic should use these internal functions
// ============================================================================

/**
 * Check if two links are of the same type
 * @internal
 */
function isSameLinkType(type1: string | undefined, type2: string | undefined): boolean {
  return normalizeLinkType(type1) === normalizeLinkType(type2);
}

/**
 * Validate if a link can be created from a specific node type
 * @internal
 */
function isValidLinkSource(linkType: LinkType, fromNodeType: string): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // No config = allow all
  
  // Empty array means all types are allowed
  if (config.allowedFromNodes.length === 0) return true;
  
  return config.allowedFromNodes.includes(fromNodeType as NodeType);
}

/**
 * Validate if a link can be created to a specific node type
 * @internal
 */
function isValidLinkTarget(linkType: LinkType, toNodeType: string): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // No config = allow all
  
  // Empty array means all types are allowed
  if (config.allowedToNodes.length === 0) return true;
  
  return config.allowedToNodes.includes(toNodeType as NodeType);
}

/**
 * Get error message for source node validation
 * @internal
 */
function getLinkValidationErrorFrom(linkType: LinkType): string {
  const config = getLinkConfiguration(linkType);
  if (!config) return 'Неверный источник связи';
  
  // Always generate message based on allowed nodes
  if (config.allowedFromNodes.length > 0) {
    return `Связи типа '${linkType}' можно создавать только ОТ: ${config.allowedFromNodes.join(', ')}`;
  }
  
  return 'Неверный источник связи';
}

/**
 * Get error message for target node validation
 * @internal
 */
function getLinkValidationErrorTo(linkType: LinkType): string {
  const config = getLinkConfiguration(linkType);
  if (!config) return 'Неверная цель связи';
  
  // Always generate message based on allowed nodes
  if (config.allowedToNodes.length > 0) {
    return `Связи типа '${linkType}' можно подключать только К: ${config.allowedToNodes.join(', ')}`;
  }
  
  return 'Неверная цель связи';
}

/**
 * Check if a link type can be bidirectional (configuration-based)
 * @internal
 */
function canLinkBeBidirectional(linkType: LinkType): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // Default to true if no config exists
  
  return config.canBeBidirectional;
}

/**
 * Check if a specific link can be physically bidirectional
 * A link can be bidirectional only if BOTH nodes can be source AND target
 * @internal
 */
function canLinkBePhysicallyBidirectional(
  linkType: LinkType, 
  fromNodeType: string, 
  toNodeType: string
): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return true; // Default to true if no config exists
  
  // First check if the link type supports bidirectional at all
  if (!config.canBeBidirectional) return false;
  
  // Check if BOTH nodes can be source (allowedFromNodes)
  const fromNodeCanBeSource = isValidLinkSource(linkType, fromNodeType);
  const toNodeCanBeSource = isValidLinkSource(linkType, toNodeType);
  
  // Check if BOTH nodes can be target (allowedToNodes)
  const fromNodeCanBeTarget = isValidLinkTarget(linkType, fromNodeType);
  const toNodeCanBeTarget = isValidLinkTarget(linkType, toNodeType);
  
  // For bidirectional to work:
  // - fromNode must be able to be both source AND target
  // - toNode must be able to be both source AND target
  return (fromNodeCanBeSource && fromNodeCanBeTarget) && 
         (toNodeCanBeSource && toNodeCanBeTarget);
}

/**
 * Check if a link type can end on canvas (toNode: null)
 * When true, a Cloud node will be automatically created at the endpoint
 * @internal
 */
function canLinkEndOnCanvas(linkType: LinkType): boolean {
  const config = getLinkConfiguration(linkType);
  if (!config) return false; // Default to false if no config exists
  
  return config.canEndOnCanvas;
}

// ============================================================================
// EDGE-TO-EDGE HELPERS
// ============================================================================

/**
 * Check if a node is a LinkLabel node (used for edge-to-edge connections)
 */
export function isLinkLabelNode(node: go.Node | null): boolean {
  if (!node) return false;
  return node.data?.category === LINK_LABEL_CATEGORY;
}

/**
 * Get the parent link category for a LinkLabel node.
 * A LinkLabel node is a label on a link; we find which link it belongs to.
 * @returns The category of the parent link, or null if not found
 */
export function getParentLinkCategory(node: go.Node): string | null {
  if (!node || node.data?.category !== LINK_LABEL_CATEGORY) return null;
  
  // A label node's labeledLink property points to the link it belongs to
  const parentLink = node.labeledLink;
  if (parentLink) {
    return normalizeLinkType(parentLink.data?.category);
  }
  
  return null;
}

/**
 * Validate if a link can originate FROM a label node (edge-to-edge source)
 * @param linkType - The type of link being drawn
 * @param labelNode - The label node being used as source
 * @returns true if valid, false otherwise
 */
function isValidEdgeSourceNode(linkType: LinkType, labelNode: go.Node): boolean {
  const parentCategory = getParentLinkCategory(labelNode);
  if (!parentCategory) return false;
  return isValidEdgeSource(linkType, parentCategory);
}

/**
 * Validate if a link can connect TO a label node (edge-to-edge target)
 * @param linkType - The type of link being drawn
 * @param labelNode - The label node being used as target
 * @returns true if valid, false otherwise
 */
function isValidEdgeTargetNode(linkType: LinkType, labelNode: go.Node): boolean {
  const parentCategory = getParentLinkCategory(labelNode);
  if (!parentCategory) return false;
  return isValidEdgeTarget(linkType, parentCategory);
}

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

/**
 * Result of validation operation with reason
 */
export interface ValidationResult {
  /** Whether the operation is valid */
  isValid: boolean;
  /** Human-readable reason (error message or success message) */
  reason: string;
}

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
 * Validate if a link can be reversed and get the reason
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Current source node key
 * @param toKey - Current target node key
 * @param linkType - Type of the link
 * @param linkKey - Key of the link to reverse
 * @returns Validation result with reason
 */
export function validateReverse(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined,
  linkKey: go.Key
): ValidationResult {
  // Get node data
  const fromNodeData = model.findNodeDataForKey(fromKey);
  const toNodeData = model.findNodeDataForKey(toKey);
  
  if (!fromNodeData || !toNodeData) {
    return { isValid: false, reason: 'Узлы не найдены' };
  }
  
  const normalizedLinkType = (linkType || DEFAULT_LINK_TYPE) as LinkType;
  
  // Check if reversing (toKey -> fromKey) would create a duplicate
  if (hasDuplicateLink(model, toKey, fromKey, linkType, linkKey)) {
    return { isValid: false, reason: 'Разворот создаст дубликат связи' };
  }
  
  // Handle LinkLabel nodes (edge-to-edge connections)
  const fromIsLabel = fromNodeData.category === LINK_LABEL_CATEGORY;
  const toIsLabel = toNodeData.category === LINK_LABEL_CATEGORY;
  
  // After reverse: toNode becomes source, fromNode becomes target
  // Validate that toNode can be a source (after reverse)
  if (toIsLabel) {
    // toNode is a label node - check edge source validation
    // We can't do full validation without the diagram, so allow it
    // (the linking tool will validate at draw time)
  } else if (!isValidLinkSource(normalizedLinkType, toNodeData.category)) {
    return { 
      isValid: false, 
      reason: getLinkValidationErrorFrom(normalizedLinkType)
    };
  }
  
  // Validate that fromNode can be a target (after reverse)
  if (fromIsLabel) {
    // fromNode is a label node - check edge target validation
  } else if (!isValidLinkTarget(normalizedLinkType, fromNodeData.category)) {
    return { 
      isValid: false, 
      reason: getLinkValidationErrorTo(normalizedLinkType)
    };
  }
  
  return { isValid: true, reason: 'Развернуть направление связи' };
}

/**
 * Validate if a link can be made bidirectional and get the reason
 * @param model - The GoJS GraphLinksModel
 * @param fromKey - Source node key
 * @param toKey - Target node key
 * @param linkType - Type of the link
 * @returns Validation result with reason
 */
export function validateBidirectional(
  model: go.GraphLinksModel,
  fromKey: go.Key,
  toKey: go.Key,
  linkType: string | undefined
): ValidationResult {
  const normalizedLinkType = (linkType || DEFAULT_LINK_TYPE) as LinkType;
  
  // First check if the link type supports bidirectional at all (config-based)
  if (!canLinkBeBidirectional(normalizedLinkType)) {
    return { 
      isValid: false, 
      reason: `Связи типа '${normalizedLinkType}' не могут быть двунаправленными`
    };
  }
  
  // Get node data to check physical possibility
  const fromNodeData = model.findNodeDataForKey(fromKey);
  const toNodeData = model.findNodeDataForKey(toKey);
  
  if (!fromNodeData || !toNodeData) {
    return { isValid: false, reason: 'Узлы не найдены' };
  }
  
  // Skip physical bidirectional check for LinkLabel nodes
  // (edge-to-edge links have different validation)
  if (fromNodeData.category === LINK_LABEL_CATEGORY || toNodeData.category === LINK_LABEL_CATEGORY) {
    return { isValid: true, reason: 'Переключить двунаправленность' };
  }
  
  // Check if these specific nodes can physically support bidirectional link
  if (!canLinkBePhysicallyBidirectional(normalizedLinkType, fromNodeData.category, toNodeData.category)) {
    return { 
      isValid: false, 
      reason: `Связь между ${fromNodeData.category} и ${toNodeData.category} не может быть двунаправленной`
    };
  }
  
  return { isValid: true, reason: 'Переключить двунаправленность' };
}

/**
 * Validate if a link from a node can end on canvas (toNode: null)
 * When valid, a Cloud node will be automatically created at the endpoint
 * @param linkType - Type of the link
 * @param fromNodeType - Type of the source node
 * @returns Validation result with reason
 */
export function validateCanEndOnCanvas(
  linkType: LinkType,
  fromNodeType: string
): ValidationResult {
  // Check if this link type can end on canvas
  if (!canLinkEndOnCanvas(linkType)) {
    return { 
      isValid: false, 
      reason: `Связи типа '${linkType}' не могут заканчиваться на пустом месте` 
    };
  }
  
  // Check if source node is valid
  if (!isValidLinkSource(linkType, fromNodeType)) {
    return { 
      isValid: false, 
      reason: getLinkValidationErrorFrom(linkType)
    };
  }
  
  // Check if Cloud can be target (will be auto-created)
  if (!isValidLinkTarget(linkType, 'Cloud')) {
    return { 
      isValid: false, 
      reason: `${getLinkValidationErrorTo(linkType)} (нельзя создать Cloud узел)` 
    };
  }
  
  return { isValid: true, reason: '' };
}

// ============================================================================
// GOJS VALIDATION FUNCTIONS
// ============================================================================

/**
 * Create link validation function for linking tool
 * Uses configuration from diagram-rules.ts - no hardcoded logic!
 * Supports edge-to-edge connections via LinkLabel nodes.
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
    
    // ---- Handle LinkLabel source (edge-to-edge: link starts from an edge) ----
    if (fromNodeType === LINK_LABEL_CATEGORY) {
      if (!isValidEdgeSourceNode(linkType, fromNode)) {
        const parentCat = getParentLinkCategory(fromNode);
        console.warn(`⚠️ Links of type '${linkType}' cannot originate from edge type '${parentCat}'`);
        return false;
      }
      
      // If target is also a label node, check edge target validation
      if (toNode && toNodeType === LINK_LABEL_CATEGORY) {
        if (!isValidEdgeTargetNode(linkType, toNode)) {
          const parentCat = getParentLinkCategory(toNode);
          console.warn(`⚠️ Links of type '${linkType}' cannot connect to edge type '${parentCat}'`);
          return false;
        }
        // Check for duplicate
        if (fromNode.diagram) {
          const model = fromNode.diagram.model as go.GraphLinksModel;
          if (model instanceof go.GraphLinksModel) {
            if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType)) {
              console.warn(`⚠️ Duplicate link of type '${linkType}' already exists between these label nodes`);
              return false;
            }
          }
        }
        return true;
      }
      
      // Source is label, target is a regular node
      if (toNode) {
        if (!isValidLinkTarget(linkType, toNodeType)) {
          console.warn(`⚠️ ${getLinkValidationErrorTo(linkType)}!`);
          return false;
        }
        // Check for duplicate
        if (fromNode.diagram) {
          const model = fromNode.diagram.model as go.GraphLinksModel;
          if (model instanceof go.GraphLinksModel) {
            if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType)) {
              console.warn(`⚠️ Duplicate link already exists`);
              return false;
            }
          }
        }
        return true;
      }
      
      // Source is label, target is canvas - check canEndOnCanvas
      if (!toNode) {
        if (!canLinkEndOnCanvas(linkType)) {
          return false;
        }
        return true;
      }
      
      return true;
    }
    
    // ---- Standard source node validation ----
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
    
    // ---- Handle LinkLabel target (edge-to-edge: link ends at an edge) ----
    if (toNodeType === LINK_LABEL_CATEGORY) {
      if (!isValidEdgeTargetNode(linkType, toNode)) {
        const parentCat = getParentLinkCategory(toNode);
        console.warn(`⚠️ Links of type '${linkType}' cannot connect to edge type '${parentCat}'`);
        return false;
      }
      // Check for duplicate
      if (fromNode.diagram) {
        const model = fromNode.diagram.model as go.GraphLinksModel;
        if (model instanceof go.GraphLinksModel) {
          if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType)) {
            console.warn(`⚠️ Duplicate link already exists`);
            return false;
          }
        }
      }
      return true;
    }
    
    // ---- Standard target node validation ----
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
 * Supports edge-to-edge connections via LinkLabel nodes.
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
    
    // ---- Handle LinkLabel source (edge-to-edge) ----
    if (fromNodeType === LINK_LABEL_CATEGORY) {
      if (!isValidEdgeSourceNode(linkType, fromNode)) {
        return false;
      }
      
      if (toNode && toNodeType === LINK_LABEL_CATEGORY) {
        if (!isValidEdgeTargetNode(linkType, toNode)) return false;
        if (fromNode.diagram) {
          const model = fromNode.diagram.model as go.GraphLinksModel;
          if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType, link.data.key)) return false;
        }
        return true;
      }
      
      if (toNode) {
        if (!isValidLinkTarget(linkType, toNodeType)) return false;
        if (fromNode.diagram) {
          const model = fromNode.diagram.model as go.GraphLinksModel;
          if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType, link.data.key)) return false;
        }
        return true;
      }
      
      if (!toNode && !canLinkEndOnCanvas(linkType)) return false;
      return true;
    }
    
    // ---- Standard source validation ----
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
    
    // ---- Handle LinkLabel target (edge-to-edge) ----
    if (toNodeType === LINK_LABEL_CATEGORY) {
      if (!isValidEdgeTargetNode(linkType, toNode)) {
        return false;
      }
      if (fromNode.diagram) {
        const model = fromNode.diagram.model as go.GraphLinksModel;
        if (hasDuplicateLink(model, fromNode.data.key, toNode.data.key, linkType, link.data.key)) return false;
      }
      return true;
    }
    
    // ---- Standard target validation ----
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
