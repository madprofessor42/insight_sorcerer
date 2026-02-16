/**
 * Diagram Modification Types (Frontend)
 * 
 * Mirrors backend types for diagram modification proposals from LLM
 */

// ============================================================================
// NODE OPERATIONS
// ============================================================================

export interface AddNode {
  operation: 'add_node';
  category: 'Stock' | 'Variable' | 'Converter' | 'Cloud';
  name: string;
  initialValue?: string | number; // For Stock
  value?: string | number;         // For Variable (can be number or formula string)
  input?: string;                  // For Converter
  values?: string;                 // For Converter
  reasoning: string;
}

export interface UpdateNode {
  operation: 'update_node';
  nodeId: string;                  // ID of the node from diagram
  name: string;                    // Current name (for UI display)
  newName?: string;
  initialValue?: string | number; // For Stock
  value?: string | number;         // For Variable (can be number or formula string)
  input?: string;                  // For Converter
  values?: string;                 // For Converter
  reasoning: string;
}

export interface DeleteNode {
  operation: 'delete_node';
  nodeId: string;                  // ID of the node from diagram
  name: string;                    // Name (for UI display)
  reasoning: string;
}

// ============================================================================
// LINK OPERATIONS
// ============================================================================

export interface AddLink {
  operation: 'add_link';
  linkType: 'link' | 'flow';
  fromId: string;                 // ID of the source node
  toId: string;                   // ID of the target node
  name?: string;
  flowRate?: string | number;
  bidirectional?: boolean;
  reasoning: string;
}

export interface UpdateLink {
  operation: 'update_link';
  linkId: string;                 // ID of the link from diagram
  name: string;                   // Current name (for UI display)
  newName?: string;
  flowRate?: string | number;
  bidirectional?: boolean;
  reasoning: string;
}

export interface DeleteLink {
  operation: 'delete_link';
  linkId: string;                 // ID of the link from diagram
  name: string;                   // Name (for UI display)
  reasoning: string;
}

// ============================================================================
// COMBINED TYPES
// ============================================================================

export type DiagramOperation = 
  | AddNode 
  | UpdateNode 
  | DeleteNode 
  | AddLink 
  | UpdateLink 
  | DeleteLink;

export interface DiagramModificationProposal {
  reasoning: string;
  operations: DiagramOperation[];
}

// ============================================================================
// UI STATE
// ============================================================================

export interface ModificationProposalWithState extends DiagramModificationProposal {
  id: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applying';
}

