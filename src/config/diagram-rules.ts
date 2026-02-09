import type { LinkType } from '../store/diagramSlice';

/**
 * Node types available in the diagram
 */
export type NodeType = 'Stock' | 'Variable';

/**
 * Link validation rule
 */
export interface LinkValidationRule {
  /** Link type */
  linkType: LinkType;
  /** Allowed source node types (empty array means all types allowed) */
  allowedFromNodes: NodeType[];
  /** Allowed target node types (empty array means all types allowed) */
  allowedToNodes: NodeType[];
  /** Error message when source node is invalid */
  errorMessageFrom?: string;
  /** Error message when target node is invalid */
  errorMessageTo?: string;
}

/**
 * Diagram validation configuration
 * This is the single source of truth for all link validation rules
 */
export const LINK_VALIDATION_RULES: LinkValidationRule[] = [
  {
    linkType: 'flow',
    allowedFromNodes: ['Stock'],
    allowedToNodes: ['Stock'],
    errorMessageFrom: 'Flow links can only be created FROM Stock nodes',
    errorMessageTo: 'Flow links can only connect TO Stock nodes'
  },
  {
    linkType: 'link',
    allowedFromNodes: [], // Can connect from any node type
    allowedToNodes: [], // Can connect to any node type
  }
];

/**
 * Get validation rule for a specific link type
 */
export function getLinkValidationRule(linkType: LinkType): LinkValidationRule | undefined {
  return LINK_VALIDATION_RULES.find(rule => rule.linkType === linkType);
}

/**
 * Validate if a link can be created from a specific node type
 */
export function isValidLinkSource(linkType: LinkType, fromNodeType: string): boolean {
  const rule = getLinkValidationRule(linkType);
  if (!rule) return true; // No rule = allow all
  
  // Empty array means all types are allowed
  if (rule.allowedFromNodes.length === 0) return true;
  
  return rule.allowedFromNodes.includes(fromNodeType as NodeType);
}

/**
 * Validate if a link can be created to a specific node type
 */
export function isValidLinkTarget(linkType: LinkType, toNodeType: string): boolean {
  const rule = getLinkValidationRule(linkType);
  if (!rule) return true; // No rule = allow all
  
  // Empty array means all types are allowed
  if (rule.allowedToNodes.length === 0) return true;
  
  return rule.allowedToNodes.includes(toNodeType as NodeType);
}

/**
 * Get error message for source node validation
 */
export function getLinkValidationErrorFrom(linkType: LinkType): string {
  const rule = getLinkValidationRule(linkType);
  if (!rule) return 'Invalid link source';
  
  if (rule.errorMessageFrom) return rule.errorMessageFrom;
  
  // Generate default message based on allowed nodes
  if (rule.allowedFromNodes.length > 0) {
    return `Links of type '${linkType}' can only be created from: ${rule.allowedFromNodes.join(', ')}`;
  }
  
  return 'Invalid link source';
}

/**
 * Get error message for target node validation
 */
export function getLinkValidationErrorTo(linkType: LinkType): string {
  const rule = getLinkValidationRule(linkType);
  if (!rule) return 'Invalid link target';
  
  if (rule.errorMessageTo) return rule.errorMessageTo;
  
  // Generate default message based on allowed nodes
  if (rule.allowedToNodes.length > 0) {
    return `Links of type '${linkType}' can only connect to: ${rule.allowedToNodes.join(', ')}`;
  }
  
  return 'Invalid link target';
}

